from fastapi import APIRouter, HTTPException, Header, BackgroundTasks
from nexyn.ingestion import IngestPayload, normalize, duplicate_cache
from nexyn.registry import WeightRegistry
from nexyn.evaluation_engine import EvaluationEngine
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nexyn")

async def process_payloads_background(payloads):
    registry = WeightRegistry()
    await registry.init_db()
    engine = EvaluationEngine(registry)
    
    for p in payloads:
        try:
            await engine.evaluate(p)
        except Exception as e:
            logger.error(f"Background evaluation failed: {e}")

@router.post("/ingest", response_model=dict)
async def ingest(
    payload: IngestPayload,
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_nim_key: str = Header(..., alias="x-nim-key"),
    x_cognee_key: str = Header(..., alias="x-cognee-key"),
    x_cognee_url: str = Header(None, alias="x-cognee-url")
):
    payloads = normalize(payload, x_tenant_id, x_user_id, x_nim_key, x_cognee_key, x_cognee_url)
    
    responses = []
    valid_payloads = []
    
    for p in payloads:
        if duplicate_cache.check_and_add(p.content_hash, p.text):
            responses.append({"status": "dropped", "reason": "exact or semantic duplicate in rapid-fire buffer", "content_hash": p.content_hash})
            continue

        valid_payloads.append(p)
        responses.append({"status": "evaluating", "content_hash": p.content_hash, "text": p.text[:50] + "..." if len(p.text)>50 else p.text})
            
    if valid_payloads:
        # AWAIT SYNCHRONOUSLY! Vercel Serverless Python kills background tasks instantly.
        await process_payloads_background(valid_payloads)
        
    return {"status": "processed", "chunks": len(payloads), "results": responses}
