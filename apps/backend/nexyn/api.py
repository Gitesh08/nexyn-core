import logging
import asyncio
import contextvars
import weakref
from typing import Any, Optional

from nexyn.registry import WeightRegistry
from nexyn.evaluation_engine import EvaluationEngine
from nexyn.retrieval_engine import RetrievalEngine
from nexyn.consolidation_engine import ConsolidationEngine
from nexyn.ingestion import IngestPayload
from nexyn.models import RecallRequest

logger = logging.getLogger(__name__)

# State scoped to running event loops to prevent "Event loop is closed" errors
_registries = weakref.WeakKeyDictionary()
_eval_engines = weakref.WeakKeyDictionary()
_retrieval_engines = weakref.WeakKeyDictionary()
_consolidation_engines = weakref.WeakKeyDictionary()

_config = {
    "nim_api_key": "",
    "cognee_api_key": "",
    "cognee_url": "",
    "tenant_id": "default",
    "user_id": "default"
}

_processing_depth = contextvars.ContextVar("nexyn_processing_depth", default=0)

def configure(nim_api_key: str, cognee_api_key: str = "", cognee_url: str = "", tenant_id: str = "default", user_id: str = "default"):
    _config["nim_api_key"] = nim_api_key
    _config["cognee_api_key"] = cognee_api_key
    _config["cognee_url"] = cognee_url
    _config["tenant_id"] = tenant_id
    _config["user_id"] = user_id
    
async def _get_engines():
    loop = asyncio.get_running_loop()
    if loop not in _registries:
        reg = WeightRegistry()
        await reg.init_db()
        _registries[loop] = reg
        _eval_engines[loop] = EvaluationEngine(reg)
        _retrieval_engines[loop] = RetrievalEngine(reg)
        _consolidation_engines[loop] = ConsolidationEngine(reg)
        
    return _eval_engines[loop], _retrieval_engines[loop], _consolidation_engines[loop]

def _create_add_interceptor(original_func):
    async def wrapper(data: Any, *args, **kwargs):
        depth = _processing_depth.get()
        if depth > 0:
            return await original_func(data, *args, **kwargs)
            
        _processing_depth.set(depth + 1)
        try:
            eval_eng, _, _ = await _get_engines()
            if isinstance(data, str) and data.strip():
                logger.info("Nexyn Intercept: Evaluating Valence and generating biological memory tag...")
                import hashlib
                import time
                from nexyn.models import NormalizedPayload
                
                content_hash = hashlib.sha256(data.encode("utf-8")).hexdigest()
                payload = NormalizedPayload(
                    text=data,
                    timestamp=time.time(),
                    content_hash=content_hash,
                    tenant_id=_config["tenant_id"],
                    user_id=_config["user_id"],
                    dataset_name=kwargs.get("dataset_name") or kwargs.get("dataset"),
                    nim_key=_config["nim_api_key"],
                    cognee_key=_config["cognee_api_key"],
                    cognee_url=_config["cognee_url"]
                )
                
                try:
                    await eval_eng.evaluate(payload)
                    return None # Handled inside eval_eng (which safely routes back here with depth>0)
                except Exception as e:
                    logger.warning(f"Nexyn: Biological evaluation skipped due to LLM error: {e}. Falling back to native storage.")
                    
            return await original_func(data, *args, **kwargs)
        finally:
            _processing_depth.set(depth)
    return wrapper

def _create_search_interceptor(original_func):
    async def wrapper(query_text: str, *args, **kwargs):
        depth = _processing_depth.get()
        if depth > 0:
            return await original_func(query_text, *args, **kwargs)
            
        _processing_depth.set(depth + 1)
        try:
            _, ret_eng, _ = await _get_engines()
            logger.info("Nexyn Intercept: Performing biomimetic recall with decay physics...")
            
            # Fire the native search in parallel (if supported, or just let retrieval engine do it)
            # Actually, RetrievalEngine uses cognee_client.recall internally, which will use original_func since depth>0!
            req = RecallRequest(
                query=query_text,
                dataset=kwargs.get("dataset_name") or kwargs.get("dataset") or "general"
            )
            result = await ret_eng.recall(
                req,
                _config["tenant_id"], 
                _config["user_id"], 
                _config["nim_api_key"], 
                _config["cognee_api_key"], 
                _config["cognee_url"]
            )
            
            # We want to preserve the native data structure as much as possible.
            # But since Cognee APIs differ by version, returning dictionaries is the safest fallback if we don't know the exact class.
            # To be minimally invasive, we'll return a list of enriched dictionaries that duck-type what developers expect.
            return [match.dict() for match in result.matches]
        finally:
            _processing_depth.set(depth)
    return wrapper

async def sweep():
    """Manually trigger Layer 3 background consolidation (decay and prune)."""
    _, _, cons_eng = await _get_engines()
    await cons_eng.sweep_once(
        _config["tenant_id"], 
        _config["user_id"], 
        _config["cognee_api_key"], 
        _config["cognee_url"]
    )
    logger.info("Nexyn Sweep complete: Dead memories pruned.")

async def inject(nim_api_key: str, cognee_api_key: str = "", cognee_url: str = "", tenant_id: str = "default", user_id: str = "default"):
    """Monkey-patches Cognee to seamlessly apply Nexyn's biological memory layers."""
    try:
        import cognee
    except ImportError:
        logger.error("Cognee is not installed. Nexyn requires cognee to be installed.")
        return
        
    configure(nim_api_key, cognee_api_key, cognee_url, tenant_id, user_id)
    
    if cognee_url or cognee_api_key:
        await cognee.serve(url=cognee_url, api_key=cognee_api_key)
        logger.info("Nexyn automatically served Cognee connection.")
    
    if not getattr(cognee, "_nexyn_patched", False):
        if hasattr(cognee, "add"):
            cognee.add = _create_add_interceptor(cognee.add)
            
        if hasattr(cognee, "search"):
            cognee.search = _create_search_interceptor(cognee.search)
            
        if hasattr(cognee, "remember"):
            cognee.remember = _create_add_interceptor(cognee.remember)
            
        if hasattr(cognee, "recall"):
            cognee.recall = _create_search_interceptor(cognee.recall)
            
        cognee._nexyn_patched = True
        logger.info("Nexyn superpowers successfully injected into Cognee runtime!")
