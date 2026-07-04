from fastapi import APIRouter, HTTPException, Header
from nexyn.ingestion import IngestPayload, normalize, duplicate_cache
from nexyn.registry import QueueRegistry

router = APIRouter(prefix="/nexyn")

ingest_queue = QueueRegistry()

async def enqueue(payload_dict: dict):
    await ingest_queue.enqueue(payload_dict)

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
    for p in payloads:
        if duplicate_cache.check_and_add(p.content_hash, p.text):
            responses.append({"status": "dropped", "reason": "exact or semantic duplicate in rapid-fire buffer", "content_hash": p.content_hash})
            continue

        try:
            await enqueue(p.model_dump())
            responses.append({"status": "queued", "content_hash": p.content_hash, "text": p.text[:50] + "..." if len(p.text)>50 else p.text})
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    return {"status": "processed", "chunks": len(payloads), "results": responses}
