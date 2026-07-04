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
    from nexyn.remote_logger import log_remote
    await log_remote(
        category="LAYER_1_INGEST",
        level="INFO",
        message=f"Ingesting raw payload into sensory buffer: '{payload.text[:50]}...'",
        tenant_id=x_tenant_id,
        user_id=x_user_id,
        details={"text_length": len(payload.text)}
    )

    payloads = normalize(payload, x_tenant_id, x_user_id, x_nim_key, x_cognee_key, x_cognee_url)
    
    responses = []
    valid_payloads = []
    dropped_count = 0
    
    for p in payloads:
        if duplicate_cache.check_and_add(p.content_hash, p.text):
            responses.append({"status": "dropped", "reason": "exact or semantic duplicate in rapid-fire buffer", "content_hash": p.content_hash})
            dropped_count += 1
            continue

        valid_payloads.append(p)
        responses.append({"status": "evaluating", "content_hash": p.content_hash, "text": p.text[:50] + "..." if len(p.text)>50 else p.text})
            
    if dropped_count > 0:
        await log_remote(
            category="LAYER_1_INGEST",
            level="INFO",
            message=f"Dropped {dropped_count} duplicate chunks from sensory buffer",
            tenant_id=x_tenant_id,
            user_id=x_user_id
        )

    if valid_payloads:
        await log_remote(
            category="LAYER_1_INGEST",
            level="INFO",
            message=f"Sensory buffer passing {len(valid_payloads)} valid chunks to Layer 2 Evaluator",
            tenant_id=x_tenant_id,
            user_id=x_user_id
        )
        # AWAIT SYNCHRONOUSLY! Vercel Serverless Python kills background tasks instantly.
        await process_payloads_background(valid_payloads)
        
    return {"status": "processed", "chunks": len(payloads), "results": responses}
