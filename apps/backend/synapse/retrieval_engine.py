import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Tuple
from .models import RecallRequest, RecallResult, RecallMatch
from .registry import WeightRegistry
from .decay import calculate_current_weight
from .config import settings
from . import cognee_client

logger = logging.getLogger(__name__)

class RetrievalEngine:
    def __init__(self, registry: WeightRegistry):
        self.registry = registry
        # cache key -> (RecallResult, expires_at)
        self._cache: Dict[str, Tuple[RecallResult, datetime]] = {}

    def _get_cache_key(self, request: RecallRequest) -> str:
        return f"{request.query}:{request.dataset}:{request.top_k}:{request.min_weight}"

    async def recall(self, request: RecallRequest) -> RecallResult:
        cache_key = self._get_cache_key(request)
        now = datetime.now(timezone.utc)
        
        # Check cache
        if cache_key in self._cache:
            cached_result, expires_at = self._cache[cache_key]
            if now < expires_at:
                logger.debug(f"Cache hit for query: {request.query}")
                return cached_result
            else:
                del self._cache[cache_key]

        try:
            raw_results = await asyncio.wait_for(
                cognee_client.recall(request.query, request.dataset or "general", request.top_k),
                timeout=settings.retrieval_timeout_seconds
            )
        except asyncio.TimeoutError:
            logger.warning(f"Recall timed out after {settings.retrieval_timeout_seconds}s for query: {request.query}")
            return RecallResult(matches=[], error="timeout", is_timeout=True)
        except Exception as e:
            logger.error(f"Recall failed: {e}")
            return RecallResult(matches=[], error=str(e))
            
        if not raw_results:
            logger.info("Cognee returned empty raw_results.")
            result = RecallResult(matches=[])
            self._cache_result(cache_key, result, now)
            return result

        logger.info(f"Cognee raw_results count: {len(raw_results)}")
        matches = []
        for entry in raw_results:
            logger.info(f"Processing entry: {entry}")
            node_id = entry.get("raw", {}).get("id") or entry.get("metadata", {}).get("id") or entry.get("text")
            logger.info(f"Extracted node_id from entry: {node_id}")
            if not node_id:
                logger.info("Skipping: node_id is empty")
                continue
                
            trace = await self.registry.get(node_id)
            if not trace:
                import hashlib
                text = entry.get("text")
                if text:
                    content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
                    logger.info(f"Trying fallback content_hash: {content_hash}")
                    trace = await self.registry.get(content_hash)
                    if not trace:
                        logger.info(f"Trying fallback get_by_text: {text}")
                        trace = await self.registry.get_by_text(text)
                    if not trace:
                        logger.info(f"Trying fallback get_by_fuzzy_text: {text}")
                        trace = await self.registry.get_by_fuzzy_text(text)
            
            if not trace:
                logger.info(f"Skipping: trace not found in registry for node_id {node_id}")
                continue
                
            if trace.status in ("pruned", "pending_prune"):
                logger.info(f"Skipping: trace status is {trace.status}")
                continue
                
            elapsed_days = (now - trace.last_accessed).total_seconds() / 86400.0
            w_current = calculate_current_weight(trace.weight_initial, trace.decay_rate, elapsed_days)
            
            if request.min_weight is not None and w_current < request.min_weight:
                continue
                
            semantic_score = float(entry.get("score", entry.get("raw", {}).get("score", 0.0)))
            weight_factor = min(w_current / 100.0, 1.0) 
            composite = (semantic_score * 0.6) + (weight_factor * 0.4)
            
            matches.append(RecallMatch(
                node_id=node_id,
                text=trace.text,
                current_weight=w_current,
                valence_score=trace.valence_score,
                semantic_similarity=semantic_score,
                composite_score=composite
            ))
            
        matches.sort(key=lambda x: x.composite_score, reverse=True)
        matches = matches[:request.top_k]
        
        result = RecallResult(matches=matches)
        self._cache_result(cache_key, result, now)
        
        if settings.reinforce_on_recall:
            for match in matches:
                await self.reinforce(match.node_id)
                
        return result

    def _cache_result(self, key: str, result: RecallResult, now: datetime):
        expires_at = now + timedelta(seconds=settings.retrieval_cache_ttl_seconds)
        self._cache[key] = (result, expires_at)

    async def reinforce(self, node_id: str) -> None:
        """
        Bumps last_accessed_at in the registry to reset decay clock.
        """
        trace = await self.registry.get(node_id)
        if not trace or trace.status in ("pruned", "pending_prune"):
            logger.info(f"Cannot reinforce node {node_id} (already pruned/missing).")
            return
            
        await self.registry.touch_last_accessed(node_id)
