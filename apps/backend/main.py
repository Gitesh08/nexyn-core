import os
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from synapse.registry import WeightRegistry
from synapse.retrieval_engine import RetrievalEngine
from synapse.models import RecallRequest
from tests.fixtures import seed_sample_memories
from synapse.router import router as synapse_router
from pydantic import BaseModel

class ConfigRequest(BaseModel):
    nvidia_nim_api_key: str | None = None
    cognee_api_key: str | None = None

from synapse.consumer import start_consumer
from synapse.consolidation_engine import ConsolidationEngine
from typing import List
import math
import cognee
import os

logger = logging.getLogger(__name__)

background_tasks = set()

async def start_sweeper(registry: WeightRegistry):
    logger.info("Starting background sweeper for Layer 3 consolidation...")
    engine = ConsolidationEngine(registry)
    while True:
        try:
            await asyncio.sleep(60) # Sweep every 60 seconds
            await engine.sweep_once()
        except asyncio.CancelledError:
            logger.info("Sweeper task cancelled. Shutting down...")
            break
        except Exception as e:
            logger.error(f"Error in sweeper: {e}")
            await asyncio.sleep(5)

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
    
    # Start Layer 3 sweeper
    sweeper_task = asyncio.create_task(start_sweeper(registry))
    background_tasks.add(sweeper_task)
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    consumer_task.cancel()
    sweeper_task.cancel()
    try:
        await consumer_task
        await sweeper_task
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

@app.get("/api/memories")
async def get_memories():
    """Returns all traces in the registry for the logs dashboard."""
    registry = WeightRegistry()
    await registry.init_db()
    traces = await registry.list_all(batch_size=1000)
        
    response = []
    for t in traces:
        t_dict = t.model_dump() if hasattr(t, "model_dump") else t.dict()
        if math.isinf(t_dict["weight_initial"]):
            t_dict["weight_initial"] = None
        response.append(t_dict)
        
    return response

@app.delete("/api/memories")
async def clear_memories():
    """Clears all traces in the registry (useful for testing/demo)."""
    registry = WeightRegistry()
    await registry.init_db()
    await registry.clear_all()
    return {"status": "cleared"}

@app.post("/api/recall")
async def execute_recall(request: RecallRequest):
    """Executes a Layer 4 recall for the frontend dashboard."""
    registry = WeightRegistry()
    await registry.init_db()
    engine = RetrievalEngine(registry)
    result = await engine.recall(request)
    return result.model_dump() if hasattr(result, "model_dump") else result.dict()

@app.post("/api/config")
async def update_config(req: ConfigRequest):
    """Updates API keys dynamically and writes them to .env."""
    env_file = Path(__file__).resolve().parent.parent.parent / ".env"
    from dotenv import set_key
    from synapse.config import settings
    
    if req.nvidia_nim_api_key:
        os.environ["NVIDIA_NIM_API_KEY"] = req.nvidia_nim_api_key
        settings.NVIDIA_NIM_API_KEY = req.nvidia_nim_api_key
        set_key(str(env_file), "NVIDIA_NIM_API_KEY", req.nvidia_nim_api_key)
        
    if req.cognee_api_key:
        os.environ["COGNEE_API_KEY"] = req.cognee_api_key
        set_key(str(env_file), "COGNEE_API_KEY", req.cognee_api_key)
        # We must re-init cognee if API key changes
        cognee_url = os.getenv("COGNEE_URL", "")
        if cognee_url:
            try:
                await cognee.disconnect()
                await cognee.serve(url=cognee_url, api_key=req.cognee_api_key)
            except Exception:
                pass
        
    return {"status": "ok", "message": "Config updated successfully"}

@app.post("/api/memify")
async def execute_memify():
    """Triggers the Hackathon required cognee.cognify() pipeline."""
    from synapse.cognee_client import cognify
    await cognify(datasets=["general"])
    return {"status": "ok", "message": "Memify (cognify) pipeline triggered successfully"}
