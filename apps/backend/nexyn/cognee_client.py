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

import asyncio

_cognee_lock = asyncio.Lock()

async def _safe_cognee_execute(api_key: str, custom_url: str, func, *args, **kwargs):
    """
    Acquires a lock, configures Cognee for the specific user's API key (or falls back to env vars),
    executes the function, and releases the lock safely.
    """
    from nexyn.config import settings
    import os
    fallback_url = os.getenv("COGNEE_URL", "")
    fallback_key = os.getenv("COGNEE_API_KEY", "")
    
    active_key = api_key if api_key else fallback_key
    active_url = custom_url if custom_url else fallback_url
    
    async with _cognee_lock:
        if active_url and active_key:
            try:
                import sys
                import io
                from contextlib import redirect_stdout
                # Always ensure we are connected with the correct key for THIS specific request
                # Suppress Cognee's noisy prints to keep the terminal clean for the demo
                with redirect_stdout(io.StringIO()):
                    await cognee.disconnect()
                    await cognee.serve(url=active_url, api_key=active_key)
            except Exception as e:
                logger.warning(f"Cognee serve failed: {e}")
                
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Cognee operation failed: {e}")
            raise

async def remember(text: str, api_key: str, cognee_url: str = None, dataset: str = "general"):
    """Wrapper for cognee.remember."""
    return await _safe_cognee_execute(api_key, cognee_url, cognee.remember, text, dataset_name=dataset)

async def cognify(api_key: str, cognee_url: str = None, datasets: list[str] = None):
    """Wrapper for cognee.cognify to process pipelines."""
    if datasets:
        return await _safe_cognee_execute(api_key, cognee_url, cognee.cognify, datasets=datasets)
    return await _safe_cognee_execute(api_key, cognee_url, cognee.cognify)

async def recall(query: str, api_key: str, cognee_url: str = None, dataset: str = "general", top_k: int = 5) -> list[dict]:
    """Wrapper for cognee.search to return exact chunk matches."""
    async def _search():
        entries = await cognee.search(query_text=query, query_type="CHUNKS", datasets=[dataset])
        normalized = []
        for dataset_entry in entries:
            if isinstance(dataset_entry, dict) and "search_result" in dataset_entry:
                for chunk in dataset_entry["search_result"]:
                    normalized.append(_normalize_recall_entry(chunk))
            else:
                normalized.append(_normalize_recall_entry(dataset_entry))
        return normalized[:top_k]
        
    try:
        return await _safe_cognee_execute(api_key, cognee_url, _search)
    except Exception as e:
        logger.warning(f"Cognee search failed: {e}")
        return []

async def improve(api_key: str, cognee_url: str = None, dataset: str = "general") -> None:
    """Wrapper for cognee.improve to reinforce a dataset globally."""
    await _safe_cognee_execute(api_key, cognee_url, cognee.improve, dataset=dataset, run_in_background=True)

async def forget(node_id: str, api_key: str, cognee_url: str = None) -> None:
    """Wrapper for cognee.forget to prune a memory."""
    import uuid
    try:
        data_id_uuid = uuid.UUID(node_id)
        await _safe_cognee_execute(api_key, cognee_url, cognee.forget, data_id=data_id_uuid)
    except Exception as e:
        logger.warning(f"Cognee forget failed for node_id {node_id}: {e}")
