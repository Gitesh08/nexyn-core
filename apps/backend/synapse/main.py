import os
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from synapse.registry import WeightRegistry
from synapse.retrieval_engine import RetrievalEngine
from synapse.models import RecallRequest
from synapse.router import router as synapse_router
from pydantic import BaseModel
import uvicorn

class ConfigRequest(BaseModel):
    nvidia_nim_api_key: str | None = None
    cognee_api_key: str | None = None

from synapse.consumer import start_consumer
from synapse.consolidation_engine import ConsolidationEngine
from typing import List
import math
import cognee

logger = logging.getLogger(__name__)

background_tasks = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    cognee_url = os.getenv("COGNEE_URL", "")
    cognee_api_key = os.getenv("COGNEE_API_KEY", "")
    
    if cognee_url:
        try:
            await cognee.serve(url=cognee_url, api_key=cognee_api_key)
            logger.info(f"Connected to Cognee server at {cognee_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Cognee server: {e}")
    else:
        logger.info("Running Cognee locally")
    
    # Start Layer 2 consumer
    registry = WeightRegistry()
    await registry.init_db()
    
    consumer_task = asyncio.create_task(start_consumer(registry))
    background_tasks.add(consumer_task)
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
        
    try:
        await cognee.disconnect()
        logger.info("Disconnected from Cognee server.")
    except Exception:
        pass

app = FastAPI(title="Synapse Core API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(synapse_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Synapse Core Backend running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

from fastapi import Header

@app.get("/api/memories")
async def get_memories(
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id")
):
    registry = WeightRegistry()
    await registry.init_db()
    traces = await registry.list_all(x_tenant_id, x_user_id, batch_size=1000)
        
    response = []
    for t in traces:
        t_dict = t.model_dump() if hasattr(t, "model_dump") else t.dict()
        if math.isinf(t_dict["weight_initial"]):
            t_dict["weight_initial"] = None
        response.append(t_dict)
        
    return response

@app.delete("/api/memories")
async def clear_memories(
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id")
):
    registry = WeightRegistry()
    await registry.init_db()
    await registry.clear_all(x_tenant_id, x_user_id)
    return {"status": "cleared"}

@app.post("/api/recall")
async def execute_recall(
    request: RecallRequest,
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_nim_key: str = Header(..., alias="x-nim-key"),
    x_cognee_key: str = Header(..., alias="x-cognee-key"),
    x_cognee_url: str = Header(None, alias="x-cognee-url")
):
    registry = WeightRegistry()
    await registry.init_db()
    engine = RetrievalEngine(registry)
    result = await engine.recall(request, x_tenant_id, x_user_id, x_nim_key, x_cognee_key, x_cognee_url)
    return result.model_dump() if hasattr(result, "model_dump") else result.dict()

@app.post("/api/sweep")
async def execute_sweep(
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_cognee_key: str = Header(..., alias="x-cognee-key"),
    x_cognee_url: str = Header(None, alias="x-cognee-url")
):
    registry = WeightRegistry()
    await registry.init_db()
    engine = ConsolidationEngine(registry)
    await engine.sweep_once(x_tenant_id, x_user_id, x_cognee_key, x_cognee_url)
    return {"status": "ok", "message": "Consolidation sweep completed"}

@app.post("/api/memify")
async def execute_memify(
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_cognee_key: str = Header(..., alias="x-cognee-key"),
    x_cognee_url: str = Header(None, alias="x-cognee-url")
):
    from synapse.cognee_client import cognify
    dataset_name = f"{x_tenant_id}_{x_user_id}_general"
    await cognify(x_cognee_key, x_cognee_url, datasets=[dataset_name])
    return {"status": "ok", "message": "Memify (cognify) pipeline triggered successfully"}

def run_server():
    """Entry point for the synapse-server CLI command."""
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("synapse.main:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    run_server()
