from fastapi import APIRouter, HTTPException
from synapse.ingestion import IngestPayload, normalize, duplicate_cache
from synapse.registry import QueueRegistry

router = APIRouter(prefix="/synapse")

ingest_queue = QueueRegistry()

async def enqueue(payload_dict: dict):
    await ingest_queue.enqueue(payload_dict)

@router.post("/ingest", response_model=dict)
async def ingest(payload: IngestPayload):
    payloads = normalize(payload)
    
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
