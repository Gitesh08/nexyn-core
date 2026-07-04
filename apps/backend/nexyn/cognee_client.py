"""
Nexyn Cognee client — stateless, multi-tenant, deployment-safe.

Architecture decision:
  - We SKIP cognify() entirely for ingest. cognify builds a slow LLM knowledge
    graph which times out on every free-tier deployment.
  - Instead we embed the valence/weight metadata INSIDE the stored text as a
    structured JSON tag. This lets us recover full trace data from any Cognee
    search result without needing the local SQLite registry.
  - Search uses CHUNKS (raw vector similarity), not INSIGHTS (graph traversal),
    because CHUNKS works immediately after remember() with no cognify() required.
"""
import json
import logging
import asyncio
import re
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import cognee
except ImportError:
    cognee = None

_cognee_lock = asyncio.Lock()

# ---------------------------------------------------------------------------
# Metadata tag helpers
# ---------------------------------------------------------------------------

_TAG_PREFIX = "__nexyn__"
_TAG_RE = re.compile(r"__nexyn__(\{.*?\})$", re.DOTALL)

def _embed_metadata(text: str, metadata: dict) -> str:
    """Append a compact JSON metadata tag to the stored text."""
    tag = json.dumps(metadata, separators=(",", ":"))
    return f"{text} {_TAG_PREFIX}{tag}"

def _extract_metadata(raw_text: str) -> tuple[str, dict]:
    """
    Split stored text back into (clean_text, metadata_dict).
    Returns (raw_text, {}) if no tag found.
    """
    m = _TAG_RE.search(raw_text)
    if not m:
        return raw_text, {}
    clean = raw_text[:m.start()].rstrip()
    try:
        meta = json.loads(m.group(1))
    except Exception:
        meta = {}
    return clean, meta

# ---------------------------------------------------------------------------
# Cognee connection management
# ---------------------------------------------------------------------------

async def _safe_cognee_execute(api_key: str, custom_url: str, func, *args, **kwargs):
    """
    Lock + connect + execute Cognee function safely.
    Falls back to env-var credentials when no per-user key is provided.
    """
    import os
    fallback_url = os.getenv("COGNEE_URL", "")
    fallback_key = os.getenv("COGNEE_API_KEY", "")

    active_key = api_key or fallback_key
    active_url = custom_url or fallback_url

    async with _cognee_lock:
        if active_url and active_key:
            try:
                import io
                from contextlib import redirect_stdout
                with redirect_stdout(io.StringIO()):
                    await cognee.disconnect()
                    await cognee.serve(url=active_url, api_key=active_key)
                
                from nexyn.remote_logger import log_remote
                await log_remote(
                    category="API_KEY_VALIDATION",
                    level="INFO",
                    message="Cognee API key validation succeeded (connected to server).",
                    details={"url": active_url}
                )
            except Exception as e:
                logger.warning(f"Cognee serve failed: {e}")
                from nexyn.remote_logger import log_remote
                await log_remote(
                    category="API_KEY_VALIDATION",
                    level="ERROR",
                    message=f"Cognee API key validation failed: {e}",
                    details={"url": active_url}
                )
        else:
            from nexyn.remote_logger import log_remote
            await log_remote(
                category="API_KEY_VALIDATION",
                level="WARNING",
                message="Cognee API credentials or URL are missing. Operating in default/local mode.",
                details={"url": active_url}
            )

        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Cognee operation failed: {e}")
            raise

# ---------------------------------------------------------------------------
# Core operations
# ---------------------------------------------------------------------------

async def remember(
    text: str,
    api_key: str,
    cognee_url: str = None,
    dataset: str = "general",
    metadata: dict = None,
) -> object:
    """
    Store text in Cognee's vector store.
    If metadata dict is provided, it is embedded as a compact JSON tag so that
    recall() can reconstruct full trace data without querying SQLite.
    No cognify() call — vector index is updated automatically by Cognee's
    CHUNKS indexer which runs at remember() time.
    """
    stored_text = _embed_metadata(text, metadata) if metadata else text
    logger.info(f"[DEBUG remember] Attempting to add text to dataset '{dataset}'")
    try:
        res = await _safe_cognee_execute(
            api_key, cognee_url, cognee.add, stored_text, dataset_name=dataset
        )
        logger.info(f"[DEBUG remember] cognee.add result: {res}")
        return res
    except AttributeError:
        # Fallback for older cognee versions
        logger.info(f"[DEBUG remember] Fallback to cognee.remember")
        return await _safe_cognee_execute(
            api_key, cognee_url, cognee.remember, stored_text, dataset_name=dataset
        )


async def search_chunks(
    query: str,
    api_key: str,
    cognee_url: str = None,
    dataset: str = "general",
    top_k: int = 10,
) -> list[dict]:
    """
    CHUNKS search — works immediately after remember(), no cognify() needed.
    Returns normalized dicts with (text, score, raw, metadata).
    """
    async def _search():
        logger.info(f"[DEBUG search_chunks] Executing cognee.search with query_text='{query}', datasets=['{dataset}']")
        entries = await cognee.search(
            query_type="CHUNKS",
            query_text=query,
            datasets=[dataset],
        )
        logger.info(f"[DEBUG search_chunks] raw entries returned from cognee: {entries}")
        results = []
        for entry in entries:
            if isinstance(entry, dict) and "search_result" in entry:
                for sub_entry in entry["search_result"]:
                    r = _normalize_entry(sub_entry)
                    if r and r.get("text"):
                        results.append(r)
            else:
                r = _normalize_entry(entry)
                if r and r.get("text"):
                    results.append(r)
        logger.info(f"[DEBUG search_chunks] Final normalized results count: {len(results)}")
        return results[:top_k]

    try:
        return await _safe_cognee_execute(api_key, cognee_url, _search)
    except Exception as e:
        logger.warning(f"Cognee CHUNKS search failed: {e}")
        return []


async def search_insights(
    query: str,
    api_key: str,
    cognee_url: str = None,
    dataset: str = "general",
    top_k: int = 10,
) -> list[dict]:
    """
    INSIGHTS search — slower, requires cognify(). Used as optional enhancement.
    """
    async def _search():
        entries = await cognee.search(
            query_type="INSIGHTS",
            query_text=query,
            datasets=[dataset],
        )
        results = []
        for entry in entries:
            if isinstance(entry, dict) and "search_result" in entry:
                for sub_entry in entry["search_result"]:
                    r = _normalize_entry(sub_entry)
                    if r and r.get("text"):
                        results.append(r)
            else:
                r = _normalize_entry(entry)
                if r and r.get("text"):
                    results.append(r)
        return results[:top_k]

    try:
        return await _safe_cognee_execute(api_key, cognee_url, _search)
    except Exception as e:
        logger.warning(f"Cognee INSIGHTS search failed: {e}")
        return []


async def cognify(api_key: str, cognee_url: str = None, datasets: list[str] = None):
    """
    Optional knowledge graph builder. We run this best-effort only.
    Caller must NOT depend on this for basic recall to work.
    """
    try:
        if datasets:
            return await _safe_cognee_execute(
                api_key, cognee_url, cognee.cognify, datasets=datasets
            )
        return await _safe_cognee_execute(api_key, cognee_url, cognee.cognify)
    except Exception as e:
        logger.warning(f"cognify() failed (non-fatal): {e}")


async def recall(
    query: str,
    api_key: str,
    cognee_url: str = None,
    dataset: str = "general",
    top_k: int = 5,
) -> list[dict]:
    """Backwards-compatible alias → CHUNKS search."""
    return await search_chunks(query, api_key, cognee_url, dataset, top_k)


async def recall_chunks(
    query: str,
    api_key: str,
    cognee_url: str = None,
    dataset: str = "general",
    top_k: int = 5,
) -> list[dict]:
    """Alias kept for retrieval_engine compatibility."""
    return await search_chunks(query, api_key, cognee_url, dataset, top_k)


async def improve(api_key: str, cognee_url: str = None, dataset: str = "general") -> None:
    """Wrapper for cognee.improve."""
    try:
        await _safe_cognee_execute(
            api_key, cognee_url, cognee.improve, dataset=dataset, run_in_background=True
        )
    except Exception as e:
        logger.warning(f"improve() failed: {e}")


async def forget(node_id: str, api_key: str, cognee_url: str = None) -> None:
    """Wrapper for cognee.forget."""
    import uuid
    try:
        data_id_uuid = uuid.UUID(node_id)
        await _safe_cognee_execute(
            api_key, cognee_url, cognee.forget, data_id=data_id_uuid
        )
    except Exception as e:
        logger.warning(f"Cognee forget failed for node_id {node_id}: {e}")

# ---------------------------------------------------------------------------
# Entry normalization
# ---------------------------------------------------------------------------

def _normalize_entry(entry) -> dict:
    """
    Flatten whatever shape Cognee returns into a clean dict.
    Strips the embedded __nexyn__ metadata tag and puts it in 'nexyn_meta'.
    """
    if entry is None:
        return {}

    if isinstance(entry, str):
        clean, meta = _extract_metadata(entry)
        return {"text": clean, "score": None, "raw": {}, "metadata": {}, "nexyn_meta": meta}

    if isinstance(entry, dict):
        raw_text = (
            entry.get("text") or entry.get("content") or
            entry.get("chunk_text") or entry.get("chunk") or
            entry.get("name") or entry.get("description") or ""
        )
        clean, meta = _extract_metadata(raw_text)
        score = entry.get("score") or entry.get("similarity_score")
        return {
            "text": clean,
            "score": score,
            "raw": entry.get("raw", {}) or entry,
            "metadata": entry.get("metadata", {}) or {},
            "nexyn_meta": meta,
        }

    # Pydantic model or object
    raw_text = (
        getattr(entry, "text", None) or getattr(entry, "content", None) or
        getattr(entry, "name", None) or getattr(entry, "description", None) or ""
    )
    clean, meta = _extract_metadata(raw_text)
    return {
        "text": clean,
        "score": getattr(entry, "score", None),
        "raw": getattr(entry, "raw", {}) or {},
        "metadata": getattr(entry, "metadata", {}) or {},
        "nexyn_meta": meta,
    }
