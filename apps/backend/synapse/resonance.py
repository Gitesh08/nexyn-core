import logging
from synapse import cognee_client
from synapse.models import NormalizedPayload
from synapse.config import settings

logger = logging.getLogger(__name__)

async def check_resonance(payload: NormalizedPayload) -> dict | None:
    """
    Checks if the incoming payload text already exists in memory with high similarity.
    If yes, reinforces the memory in Cognee and returns the match.
    If no, returns None.
    """
    try:
        dataset_name = f"{payload.tenant_id}_{payload.user_id}_general"
        results = await cognee_client.recall(payload.text, payload.cognee_key, dataset=dataset_name, top_k=1)
        if not results:
            return None

        top_result = results[0]
        score = top_result.get("score")
        if score is None:
            return None
            
        if score >= settings.resonance_threshold:
            logger.debug(f"Resonance hit for '{payload.text}' (score: {score})")
            # We don't call cognee_client.improve() here anymore for a single memory,
            # we will return the top result so evaluation_engine can reinforce the registry.
            return top_result

        return None
    except Exception as e:
        logger.error(f"Error checking resonance: {e}")
        return None
