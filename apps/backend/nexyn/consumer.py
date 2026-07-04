import asyncio
import logging
from nexyn.registry import WeightRegistry, QueueRegistry
from nexyn.evaluation_engine import EvaluationEngine
from nexyn.models import NormalizedPayload
from nexyn.config import settings

logger = logging.getLogger(__name__)

async def start_consumer(registry: WeightRegistry):
    logger.info("Starting background consumer for Layer 2 evaluation...")
    engine = EvaluationEngine(registry)
    queue = QueueRegistry()
    
    while True:
        try:
            payload_dict = await queue.dequeue()
            if payload_dict:
                payload = NormalizedPayload(**payload_dict)
                await engine.evaluate(payload)
            else:
                await asyncio.sleep(0.5)  # No busy-waiting
        except asyncio.CancelledError:
            logger.info("Consumer task cancelled. Shutting down...")
            break
        except Exception as e:
            logger.error(f"Error processing payload in consumer: {e}")
            await asyncio.sleep(1)
