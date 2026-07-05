import os
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import math
import hashlib
from nexyn.registry import WeightRegistry
from nexyn.retrieval_engine import RetrievalEngine
from nexyn.models import RecallRequest
from nexyn.router import router as nexyn_router
from pydantic import BaseModel

class ConfigRequest(BaseModel):
    nvidia_nim_api_key: str | None = None
    cognee_api_key: str | None = None

from nexyn.consumer import start_consumer
from nexyn.consolidation_engine import ConsolidationEngine
from typing import List
import math
import cognee
import os

logger = logging.getLogger(__name__)

background_tasks = set()

# Background sweeper removed in favor of manual sweep endpoint

@asynccontextmanager
async def lifespan(app: FastAPI):
    from nexyn.remote_logger import log_remote, close_db_pool
    
    # Initialize remote logging & log startup
    await log_remote(
        category="SYSTEM_START",
        level="INFO",
        message="Nexyn Core backend application starting up.",
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
    
    # Initialize Registry
    registry = WeightRegistry()
    await registry.init_db()
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await log_remote(
        category="SYSTEM_SHUTDOWN",
        level="INFO",
        message="Nexyn Core backend application shutting down."
    )
        
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
    """Returns all traces in the registry for the logs dashboard."""
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

async def event_generator(tenant_id: str, user_id: str):
    registry = WeightRegistry()
    await registry.init_db()
    last_hash = ""
    while True:
        traces = await registry.list_all(tenant_id, user_id, batch_size=1000)
        
        response = []
        for t in traces:
            t_dict = t.model_dump() if hasattr(t, "model_dump") else t.dict()
            if math.isinf(t_dict["weight_initial"]):
                t_dict["weight_initial"] = None
            response.append(t_dict)
            
        current_data = json.dumps(response, default=str)
        current_hash = hashlib.md5(current_data.encode()).hexdigest()
        
        if current_hash != last_hash:
            last_hash = current_hash
            yield f"data: {current_data}\n\n"
            
        await asyncio.sleep(1)

@app.get("/api/memories/stream")
async def stream_memories(
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id")
):
    """SSE endpoint for real-time memory trace updates."""
    return StreamingResponse(
        event_generator(x_tenant_id, x_user_id),
        media_type="text/event-stream"
    )

@app.delete("/api/memories")
async def clear_memories(
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_cognee_key: str = Header(None, alias="x-cognee-key"),
    x_cognee_url: str = Header(None, alias="x-cognee-url")
):
    """Clears all traces in the registry (useful for testing/demo)."""
    registry = WeightRegistry()
    await registry.init_db()
    from nexyn.cognee_client import forget
    # Purge from Cognee Cloud first
    traces = await registry.list_all(x_tenant_id, x_user_id, batch_size=9999)
    for trace in traces:
        if hasattr(trace, "node_id") and trace.node_id:
            await forget(trace.node_id, x_cognee_key, x_cognee_url)
            
    # Purge from local SQLite
    await registry.clear_all(x_tenant_id, x_user_id)
    return {"status": "ok", "message": "All memory traces purged from local registry and Cognee cloud."}

@app.post("/api/recall")
async def execute_recall(
    request: RecallRequest,
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_nim_key: str = Header(..., alias="x-nim-key"),
    x_cognee_key: str = Header(..., alias="x-cognee-key"),
    x_cognee_url: str = Header(None, alias="x-cognee-url")
):
    """Executes a Layer 4 recall for the frontend dashboard."""
    registry = WeightRegistry()
    await registry.init_db()
    engine = RetrievalEngine(registry)
    # The RetrievalEngine needs to be updated to accept the keys/IDs, but since we are short on time,
    # and recall uses Cognee, we'll update it directly.
    # Actually wait, RetrievalEngine is in nexyn/retrieval_engine.py.
    # Let's pass the keys to it!
    result = await engine.recall(request, x_tenant_id, x_user_id, x_nim_key, x_cognee_key, x_cognee_url)
    return result.model_dump() if hasattr(result, "model_dump") else result.dict()

@app.post("/api/sweep")
async def execute_sweep(
    x_tenant_id: str = Header(..., alias="x-tenant-id"),
    x_user_id: str = Header(..., alias="x-user-id"),
    x_cognee_key: str = Header(..., alias="x-cognee-key"),
    x_cognee_url: str = Header(None, alias="x-cognee-url")
):
    """Manually triggers a Layer 3 sweep for the user."""
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
    """Triggers the Hackathon required cognee.cognify() pipeline."""
    from nexyn.cognee_client import cognify
    dataset_name = f"{x_tenant_id}_{x_user_id}_general"
    await cognify(x_cognee_key, x_cognee_url, datasets=[dataset_name])
    return {"status": "ok", "message": "Memify (cognify) pipeline triggered successfully"}
