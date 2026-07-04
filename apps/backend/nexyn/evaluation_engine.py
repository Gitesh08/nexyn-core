import os
import json
import logging
import httpx
from datetime import datetime, timezone
from nexyn.models import NormalizedPayload, MemoryTrace
from nexyn.kinetics import get_kinetic_params
from nexyn.registry import WeightRegistry
from nexyn import cognee_client
from nexyn.valence import determine_valence
from nexyn.resonance import check_resonance
from nexyn.config import settings

logger = logging.getLogger(__name__)

class EvaluationEngine:
    def __init__(self, registry: WeightRegistry):
        self.registry = registry

    async def detect_contradiction(self, new_text: str, existing_rules: list[dict], nim_key: str) -> str | None:
        """
        Detect if the new core rule contradicts any of the existing core rules.
        Returns the node_id of the contradicting rule if found, otherwise None.
        """
        if not existing_rules:
            return None

        if not nim_key:
            logger.warning("NIM API key not set. Skipping contradiction detection.")
            return None

        rules_data = [{"id": rule.get("raw", {}).get("id") or rule.get("metadata", {}).get("id") or rule.get("text"), "text": rule["text"]} for rule in existing_rules if rule.get("text")]
        
        if not rules_data:
            return None

        prompt = f"""You are a contradiction detector. Compare the new core rule with the list of existing core rules.
New rule: "{new_text}"
Existing rules:
{json.dumps(rules_data, indent=2)}

If the new rule DIRECTLY contradicts an existing rule, output the 'id' of the contradicted rule.
If there is no contradiction, output null.
Output ONLY valid JSON in this format: {{"contradicts_id": "<id>" or null}}"""

        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {nim_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": settings.NVIDIA_NIM_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.0,
            "max_tokens": 100
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=headers, json=data, timeout=10.0)
                response.raise_for_status()
                content = response.json()["choices"][0]["message"]["content"].strip()
                if content.startswith("```json"): content = content[7:]
                if content.endswith("```"): content = content[:-3]
                parsed = json.loads(content)
                return parsed.get("contradicts_id")
            except Exception as e:
                logger.error(f"Contradiction detection failed: {e}")
                return None

    async def evaluate(self, payload: NormalizedPayload) -> dict:
        valences = await determine_valence(payload)
        
        responses = []
        for valence in valences:
            import hashlib
            fission_hash = payload.content_hash
            fission_text = payload.text
            
            if len(valences) > 1:
                fission_text = valence.text if valence.text else payload.text
                fission_hash = hashlib.sha256(fission_text.encode("utf-8")).hexdigest()

            # Write intermediate state for UI visibility (Layer 2 Output)
            temp_trace = MemoryTrace(
                node_id=fission_hash,
                tenant_id=payload.tenant_id,
                user_id=payload.user_id,
                text=fission_text,
                dataset="general" if valence.score < 5 else "core_rules",
                valence_score=valence.score,
                weight_initial=0.0,
                decay_rate=0.0,
                last_accessed=datetime.now(timezone.utc),
                created_at=datetime.now(timezone.utc),
                reason=valence.reasoning,
                status="dropped" if valence.score == 1 else "evaluating (layer 2)"
            )
            await self.registry.upsert(temp_trace)
            
            if valence.score == 1:
                logger.debug(f"Payload '{fission_hash}' dropped (Score 1: {valence.reasoning})")
                responses.append({"status": "dropped", "valence_score": valence.score, "reasoning": valence.reasoning})
                continue

            try:
                if valence.score in [2, 3, 4]:
                    # Resonance uses the specific fission text
                    fission_payload = NormalizedPayload(
                        text=fission_text, 
                        timestamp=payload.timestamp, 
                        content_hash=fission_hash,
                        tenant_id=payload.tenant_id,
                        user_id=payload.user_id,
                        nim_key=payload.nim_key,
                        cognee_key=payload.cognee_key,
                        cognee_url=payload.cognee_url
                    )
                    resonance_hit = await check_resonance(fission_payload)
                    
                    if resonance_hit:
                        node_id = resonance_hit.get("raw", {}).get("id") or resonance_hit.get("metadata", {}).get("id") or resonance_hit.get("text")
                        if node_id:
                            # Biological Cross-Examination: check if it actually contradicts instead of blindly reinforcing
                            contradicted_id = await self.detect_contradiction(fission_text, [resonance_hit], payload.nim_key)
                            if contradicted_id:
                                logger.info(f"Resonance contradicted {contradicted_id}, forgetting old memory.")
                                await cognee_client.forget(contradicted_id, payload.cognee_key)
                                await self.registry.delete(contradicted_id)
                                resonance_hit = None # Fall through to save new memory
                            else:
                                await self.registry.touch_last_accessed(node_id)
                                await self.registry.delete(fission_hash)
                                logger.debug(f"Reinforced resonance hit for '{fission_hash}'")
                                responses.append({"status": "resonance_hit", "valence_score": valence.score, "reasoning": valence.reasoning, "node_id": node_id})
                                continue
                        
                    # Store in Cognee with embedded metadata so recall works without SQLite
                    dataset_name = f"{payload.tenant_id}_{payload.user_id}_general"
                    params = get_kinetic_params(valence.score)
                    meta = {
                        "node_id": fission_hash,
                        "valence": valence.score,
                        "w_initial": params["w_initial"],
                        "decay_rate": params["decay_rate"],
                        "tenant_id": payload.tenant_id,
                        "user_id": payload.user_id,
                    }
                    result = await cognee_client.remember(
                        fission_text, payload.cognee_key,
                        cognee_url=payload.cognee_url,
                        dataset=dataset_name,
                        metadata=meta,
                    )
                    
                    node_id = fission_hash
                    if isinstance(result, dict):
                        node_id = result.get("id", result.get("data_id", node_id))
                    elif result and hasattr(result, "items") and not callable(result.items) and result.items:
                        node_id = result.items[0].get("id", node_id)
                    elif result and hasattr(result, "content_hash") and not callable(result.content_hash):
                        node_id = result.content_hash
                        logger.warning(f"RememberResult items empty. Falling back to content_hash {node_id}")

                    trace = MemoryTrace(
                        node_id=str(node_id),
                        tenant_id=payload.tenant_id,
                        user_id=payload.user_id,
                        text=fission_text,
                        dataset="general",
                        valence_score=valence.score,
                        weight_initial=params["w_initial"],
                        decay_rate=params["decay_rate"],
                        last_accessed=datetime.now(timezone.utc),
                        created_at=datetime.now(timezone.utc),
                        reason=valence.reasoning,
                        status="active"
                    )
                    # Mark ACTIVE immediately after remember() — cognify() runs separately
                    # and must NOT block this status update (Vercel will timeout on cognify)
                    await self.registry.delete(fission_hash)
                    await self.registry.upsert(trace)
                    logger.debug(f"Stored score {valence.score} memory {node_id}")
                    responses.append({"status": "persisted", "valence_score": valence.score, "reasoning": valence.reasoning, "node_id": str(node_id)})

                    # cognify() builds the knowledge graph — run best-effort, never block status
                    try:
                        await cognee_client.cognify(payload.cognee_key, cognee_url=payload.cognee_url, datasets=[dataset_name])
                    except Exception as cognify_err:
                        logger.warning(f"cognify() failed (non-fatal, memory already active): {cognify_err}")

                elif valence.score == 5:
                    # Ego Death Protocol (Instinct Bounding)
                    K_LIMIT = 50
                    active_core_rules = await self.registry.get_dataset_active("core_rules")
                    
                    if len(active_core_rules) >= K_LIMIT:
                        logger.warning(f"Ego Death protocol triggered. Compressing {len(active_core_rules)} core rules...")
                        all_texts = [rule.text for rule in active_core_rules]
                        compress_prompt = f"""You are the Ego Death protocol. Compress these {len(all_texts)} core rules into a single, comprehensive, highly-compressed master constraint list. 
    Do not lose any fundamental constraints, but remove all redundancy.
    Rules to compress:
    {json.dumps(all_texts, indent=2)}

    Output ONLY the compressed text. Do not output JSON, just the raw text."""

                        url = "https://integrate.api.nvidia.com/v1/chat/completions"
                        headers = {"Authorization": f"Bearer {payload.nim_key}", "Content-Type": "application/json"}
                        data = {
                            "model": settings.NVIDIA_NIM_MODEL,
                            "messages": [{"role": "user", "content": compress_prompt}],
                            "temperature": 0.0,
                            "max_tokens": 1024
                        }
                        try:
                            async with httpx.AsyncClient() as client:
                                response = await client.post(url, headers=headers, json=data, timeout=30.0)
                                response.raise_for_status()
                                compressed_text = response.json()["choices"][0]["message"]["content"].strip()
                                for rule in active_core_rules:
                                    await cognee_client.forget(rule.node_id, payload.cognee_key, cognee_url=payload.cognee_url)
                                await self.registry.delete_dataset("core_rules")
                                fission_text = compressed_text
                                fission_hash = hashlib.sha256(compressed_text.encode("utf-8")).hexdigest()
                                logger.info("Ego Death complete. Proceeding with singular compressed master node.")
                        except Exception as ego_err:
                            logger.error(f"Ego Death compression failed: {ego_err}")
                    
                    # Core rule (Normal Flow)
                    dataset_core = f"{payload.tenant_id}_{payload.user_id}_core_rules"
                    existing_rules = await cognee_client.recall(fission_text, payload.cognee_key, cognee_url=payload.cognee_url, dataset=dataset_core, top_k=10)
                    contradicted_id = await self.detect_contradiction(fission_text, existing_rules, payload.nim_key)
                    
                    if contradicted_id:
                        logger.info(f"Rule contradicts {contradicted_id}, forgetting old rule.")
                        await cognee_client.forget(contradicted_id, payload.cognee_key, cognee_url=payload.cognee_url)
                        await self.registry.delete(contradicted_id)
                        logger.info(f"Purged zombie core rule {contradicted_id} from local registry.")
                        
                    result = await cognee_client.remember(fission_text, payload.cognee_key, cognee_url=payload.cognee_url, dataset=dataset_core)
                    
                    node_id = fission_hash
                    if isinstance(result, dict):
                        node_id = result.get("id", result.get("data_id", node_id))
                    elif result and hasattr(result, "items") and not callable(result.items) and result.items:
                        node_id = result.items[0].get("id", node_id)
                    elif result and hasattr(result, "content_hash") and not callable(result.content_hash):
                        node_id = result.content_hash
                        logger.warning(f"RememberResult items empty. Falling back to content_hash {node_id}")

                    params = get_kinetic_params(5)
                    trace = MemoryTrace(
                        node_id=str(node_id),
                        tenant_id=payload.tenant_id,
                        user_id=payload.user_id,
                        text=fission_text,
                        dataset="core_rules",
                        valence_score=5,
                        weight_initial=params["w_initial"],
                        decay_rate=params["decay_rate"],
                        last_accessed=datetime.now(timezone.utc),
                        created_at=datetime.now(timezone.utc),
                        reason=valence.reasoning,
                        status="active"
                    )
                    # Mark ACTIVE immediately — cognify is best-effort and must not block
                    await self.registry.delete(fission_hash)
                    await self.registry.upsert(trace)
                    logger.info(f"Stored core rule {node_id}")
                    
                    if contradicted_id:
                        responses.append({"status": "contradiction_resolved", "valence_score": 5, "pruned_id": contradicted_id, "node_id": str(node_id), "reasoning": valence.reasoning})
                    else:
                        responses.append({"status": "persisted_core_rule", "valence_score": 5, "node_id": str(node_id), "reasoning": valence.reasoning})

                    # cognify() builds the knowledge graph — run best-effort, never block status
                    try:
                        await cognee_client.cognify(payload.cognee_key, cognee_url=payload.cognee_url, datasets=[dataset_core])
                    except Exception as cognify_err:
                        logger.warning(f"cognify() failed for core rule (non-fatal, memory already active): {cognify_err}")

            except Exception as e:
                logger.error(f"Evaluation failed for '{fission_hash}': {e}")
                # Mark the stuck trace as failed instead of leaving it as 'evaluating (layer 2)'
                failed_trace = MemoryTrace(
                    node_id=fission_hash,
                    tenant_id=payload.tenant_id,
                    user_id=payload.user_id,
                    text=fission_text,
                    dataset="general",
                    valence_score=valence.score,
                    weight_initial=0.0,
                    decay_rate=0.0,
                    last_accessed=datetime.now(timezone.utc),
                    created_at=datetime.now(timezone.utc),
                    reason=f"Evaluation error: {str(e)[:200]}",
                    status="failed"
                )
                await self.registry.upsert(failed_trace)
                responses.append({"status": "failed", "valence_score": valence.score, "error": str(e)})

        return {"status": "processed", "results": responses}
