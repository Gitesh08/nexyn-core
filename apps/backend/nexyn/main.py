import os
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from nexyn.registry import WeightRegistry
from nexyn.retrieval_engine import RetrievalEngine
from nexyn.models import RecallRequest
from nexyn.router import router as nexyn_router
from pydantic import BaseModel
import uvicorn

class ConfigRequest(BaseModel):
    nvidia_nim_api_key: str | None = None
    cognee_api_key: str | None = None

from nexyn.consumer import start_consumer
from nexyn.consolidation_engine import ConsolidationEngine
from typing import List
import math
import cognee

logger = logging.getLogger(__name__)

background_tasks = set()

@asynccontextmanager
async def lifespan(app: FastAPI):
    from nexyn.remote_logger import log_remote, close_db_pool
    
    # Initialize remote logging & log startup
    await log_remote(
        category="SYSTEM_START",
        level="INFO",
        message="Nexyn Core backend application starting up (standalone).",
        details={
            "environment": os.getenv("ENVIRONMENT", "development"),
            "port": os.getenv("PORT", "8000"),
            "cognee_url": os.getenv("COGNEE_URL", "")
        }
    )

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
    await log_remote(
        category="SYSTEM_SHUTDOWN",
        level="INFO",
        message="Nexyn Core backend application shutting down (standalone)."
    )
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

    # Close PostgreSQL connection pool
    await close_db_pool()

app = FastAPI(title="Nexyn Core API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(nexyn_router)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Nexyn Core Backend running"}

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

@app.get("/api/logs")
async def get_logs(
    limit: int = 100,
    category: str | None = None,
    x_tenant_id: str | None = Header(None, alias="x-tenant-id"),
    x_user_id: str | None = Header(None, alias="x-user-id")
):
    """Fetches system execution logs from remote PostgreSQL."""
    from nexyn.remote_logger import get_db_pool
    pool = await get_db_pool()
    if pool is None:
        return []
    
    try:
        async with pool.acquire() as conn:
            query = "SELECT id, timestamp, category, level, message, tenant_id, user_id, details FROM nexyn_logs"
            conditions = []
            params = []
            
            if x_tenant_id:
                conditions.append(f"tenant_id = ${len(params) + 1}")
                params.append(x_tenant_id)
            if x_user_id:
                conditions.append(f"user_id = ${len(params) + 1}")
                params.append(x_user_id)
            if category:
                conditions.append(f"category = ${len(params) + 1}")
                params.append(category)
                
            if conditions:
                query += " WHERE " + " AND ".join(conditions)
                
            query += f" ORDER BY timestamp DESC LIMIT ${len(params) + 1}"
            params.append(limit)
            
            rows = await conn.fetch(query, *params)
            
            logs_result = []
            for r in rows:
                import json
                details_data = {}
                if r['details']:
                    try:
                        details_data = json.loads(r['details'])
                    except Exception:
                        details_data = r['details']
                logs_result.append({
                    "id": r['id'],
                    "timestamp": r['timestamp'].isoformat() if r['timestamp'] else None,
                    "category": r['category'],
                    "level": r['level'],
                    "message": r['message'],
                    "tenant_id": r['tenant_id'],
                    "user_id": r['user_id'],
                    "details": details_data
                })
            return logs_result
    except Exception as e:
        logger.error(f"Error querying logs from Postgres: {e}")
        return []

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
    from nexyn.cognee_client import cognify
    dataset_name = f"{x_tenant_id}_{x_user_id}_general"
    await cognify(x_cognee_key, x_cognee_url, datasets=[dataset_name])
    return {"status": "ok", "message": "Memify (cognify) pipeline triggered successfully"}

def run_server():
    """Entry point for the nexyn-server CLI command."""
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("nexyn.main:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    run_server()
