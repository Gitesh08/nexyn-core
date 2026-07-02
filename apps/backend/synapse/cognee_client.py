"""
Thin wrapper around cognee API to isolate internal code from signature changes.
"""
import logging
logger = logging.getLogger(__name__)
try:
    import cognee
except ImportError:
    cognee = None

def _normalize_recall_entry(entry) -> dict:
    """Cognee's recall() returns typed objects, dicts, or strings depending on version.
    Flatten the fields into a plain dict."""
    logger.info(f"Raw entry type: {type(entry)}, dir: {dir(entry)}")
    try:
        logger.info(f"Raw entry dict: {entry.__dict__}")
    except Exception:
        pass
        
    if isinstance(entry, str):
        return {"text": entry, "score": None, "raw": {}, "metadata": {}}
    if isinstance(entry, dict):
        text = entry.get("text") or entry.get("content") or entry.get("chunk_text") or entry.get("chunk") or ""
        
        return {
            "text": text,
            "score": entry.get("score") or entry.get("similarity_score"),
            "raw": entry.get("raw", {}) or entry,
            "metadata": entry.get("metadata", {}) or {},
        }
    else:
        return {
            "text": getattr(entry, "text", None) or getattr(entry, "content", ""),
            "score": getattr(entry, "score", None),
            "raw": getattr(entry, "raw", {}) or {},
            "metadata": getattr(entry, "metadata", {}) or {},
        }

async def remember(text: str, dataset: str = "general"):
    """Wrapper for cognee.remember. Returns RememberResult."""
    return await cognee.remember(text, dataset_name=dataset)

async def cognify(datasets: list[str] = None):
    """Wrapper for cognee.cognify to process pipelines."""
    if datasets:
        return await cognee.cognify(datasets=datasets)
    return await cognee.cognify()

async def recall(query: str, dataset: str = "general", top_k: int = 5) -> list[dict]:
    """Wrapper for cognee.search to return exact chunk matches."""
    try:
        entries = await cognee.search(query_text=query, query_type="CHUNKS", datasets=[dataset])
        # cognee.search returns a list of dataset result dicts: [{'dataset_name': 'general', 'search_result': [...]}]
        normalized = []
        for dataset_entry in entries:
            if isinstance(dataset_entry, dict) and "search_result" in dataset_entry:
                for chunk in dataset_entry["search_result"]:
                    normalized.append(_normalize_recall_entry(chunk))
            else:
                normalized.append(_normalize_recall_entry(dataset_entry))
        
        return normalized[:top_k]
    except Exception as e:
        logger.warning(f"Cognee search failed (likely because graph DB is empty/uninitialized): {e}")
        return []

async def improve(dataset: str = "general") -> None:
    """Wrapper for cognee.improve to reinforce a dataset globally."""
    await cognee.improve(dataset=dataset, run_in_background=True)

async def forget(node_id: str) -> None:
    """Wrapper for cognee.forget to prune a memory."""
    # node_id must be a UUID for data_id
    import uuid
    try:
        data_id_uuid = uuid.UUID(node_id)
        await cognee.forget(data_id=data_id_uuid)
    except Exception as e:
        logger.warning(f"Cognee forget failed for node_id {node_id}: {e}")
