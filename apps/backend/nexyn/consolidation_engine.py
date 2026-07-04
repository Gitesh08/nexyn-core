import logging
from datetime import datetime, timezone
from tenacity import retry, stop_after_attempt, wait_exponential
from .registry import WeightRegistry
from .config import settings
from .decay import calculate_current_weight
from . import cognee_client

logger = logging.getLogger(__name__)

class ConsolidationEngine:
    def __init__(self, registry: WeightRegistry):
        self.registry = registry


    async def sweep_once(self, tenant_id: str, user_id: str, cognee_key: str, cognee_url: str = None) -> None:
        """
        Pages through the active registry, evaluates the current weight, 
        and prunes if W_current <= prune_floor.
        """
        from nexyn.remote_logger import log_remote
        await log_remote(
            category="LAYER_3_CONSOLIDATE",
            level="INFO",
            message="Starting memory consolidation sweep.",
            tenant_id=tenant_id,
            user_id=user_id
        )
        
        batch_size = 100
        offset = 0
        now = datetime.now(timezone.utc)
        
        pruned_count = 0
        kept_count = 0
        
        while True:
            traces = await self.registry.list_active(tenant_id, user_id, batch_size=batch_size, offset=offset)
            if not traces:
                break
                
            kept_count_batch = 0
            for trace in traces:
                elapsed_days = (now - trace.last_accessed).total_seconds() / 86400.0
                
                w_current = calculate_current_weight(
                    trace.weight_initial, 
                    trace.decay_rate, 
                    elapsed_days
                )
                
                if w_current <= settings.prune_floor:
                    # Time to prune
                    if settings.consolidation_dry_run:
                        logger.info(f"[DRY RUN] Would prune node {trace.node_id} (W={w_current:.2f} <= {settings.prune_floor})")
                        await log_remote(
                            category="LAYER_3_CONSOLIDATE",
                            level="INFO",
                            message=f"[DRY RUN] Would prune node {trace.node_id} (W={w_current:.2f} <= {settings.prune_floor})",
                            tenant_id=tenant_id,
                            user_id=user_id,
                            details={"text": trace.text}
                        )
                        kept_count_batch += 1
                        kept_count += 1
                        continue
                        
                    try:
                        # Edge-Stitching logic
                        dataset_name = f"{tenant_id}_{user_id}_general"
                        neighbors = await cognee_client.recall(trace.text, cognee_key, cognee_url=cognee_url, dataset=dataset_name, top_k=3)
                        active_neighbors = []
                        if neighbors:
                            for neighbor in neighbors:
                                # We only consider it a neighbor if it's not the exact same node we are deleting
                                n_id = neighbor.get("raw", {}).get("id") or neighbor.get("metadata", {}).get("id") or neighbor.get("text")
                                if n_id and str(n_id) != str(trace.node_id):
                                    active_neighbors.append(neighbor.get("text"))
                                    
                        if len(active_neighbors) >= 2:
                            # Synthesize a bridge string
                            bridge_string = f"Concept '{active_neighbors[0]}' is semantically linked to Concept '{active_neighbors[1]}'."
                            logger.info(f"Edge-Stitching: Bridging orphaned concepts: '{bridge_string}'")
                            await log_remote(
                                category="LAYER_3_CONSOLIDATE",
                                level="INFO",
                                message=f"Edge-Stitching: Bridging orphaned concepts: '{bridge_string}'",
                                tenant_id=tenant_id,
                                user_id=user_id
                            )
                            await cognee_client.remember(bridge_string, cognee_key, cognee_url=cognee_url, dataset=dataset_name)
                        
                        await self.registry.mark_pruned(trace.node_id)
                        await cognee_client.forget(trace.node_id, cognee_key, cognee_url)
                        logger.info(f"Pruned node {trace.node_id} (W={w_current:.2f} <= {settings.prune_floor})")
                        await log_remote(
                            category="LAYER_3_CONSOLIDATE",
                            level="INFO",
                            message=f"Pruned node {trace.node_id} (W={w_current:.2f} <= {settings.prune_floor})",
                            tenant_id=tenant_id,
                            user_id=user_id,
                            details={"text": trace.text, "decay_rate": trace.decay_rate, "elapsed_days": elapsed_days}
                        )
                        pruned_count += 1
                    except Exception as e:
                        logger.error(f"Failed to prune node {trace.node_id} in graph: {e}")
                        await log_remote(
                            category="LAYER_3_CONSOLIDATE",
                            level="ERROR",
                            message=f"Failed to prune node {trace.node_id}: {e}",
                            tenant_id=tenant_id,
                            user_id=user_id
                        )
                        await self.registry.mark_pending_prune(trace.node_id)
                        kept_count_batch += 1
                        kept_count += 1
                else:
                    logger.debug(f"Kept node {trace.node_id} (W={w_current:.2f} > {settings.prune_floor})")
                    kept_count_batch += 1
                    kept_count += 1
 
            offset += kept_count_batch

        await log_remote(
            category="LAYER_3_CONSOLIDATE",
            level="INFO",
            message=f"Memory consolidation sweep finished. Pruned: {pruned_count}, Kept: {kept_count}.",
            tenant_id=tenant_id,
            user_id=user_id,
            details={"pruned": pruned_count, "kept": kept_count}
        )
