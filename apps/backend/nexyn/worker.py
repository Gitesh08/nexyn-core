import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from .registry import WeightRegistry
from .consolidation_engine import ConsolidationEngine
from .config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_single_sweep():
    """Runs a single consolidation sweep. Useful for notebooks."""
    registry = WeightRegistry()
    await registry.init_db()
    engine = ConsolidationEngine(registry)
    await engine.sweep_once()

async def run_daemon():
    """Runs the persistent scheduler loop."""
    registry = WeightRegistry()
    await registry.init_db()
    engine = ConsolidationEngine(registry)
    
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        engine.sweep_once,
        'interval',
        seconds=settings.decay_sweep_interval_seconds,
        max_instances=1,
        id='consolidation_sweep'
    )
    
    scheduler.start()
    logger.info(f"Consolidation daemon started. Sweep interval: {settings.decay_sweep_interval_seconds}s")
    
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        scheduler.shutdown()

if __name__ == "__main__":
    try:
        asyncio.run(run_daemon())
    except KeyboardInterrupt:
        logger.info("Exiting...")
