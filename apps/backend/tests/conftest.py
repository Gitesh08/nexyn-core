import pytest
import tempfile
import os
from synapse.registry import WeightRegistry
from tests.fixtures import seed_sample_memories

@pytest.fixture
async def temp_registry():
    fd, path = tempfile.mkstemp()
    os.close(fd)
    
    registry = WeightRegistry(db_path=path)
    await registry.init_db()
    
    yield registry
    
    os.unlink(path)

@pytest.fixture
async def seeded_registry(temp_registry):
    traces = seed_sample_memories()
    for t in traces:
        await temp_registry.upsert(t)
    return temp_registry
