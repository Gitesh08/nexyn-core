import pytest
from unittest.mock import AsyncMock
from nexyn.consolidation_engine import ConsolidationEngine
from nexyn.config import settings
from tests.fixtures import seed_sample_memories

@pytest.mark.asyncio
async def test_consolidation_sweep(seeded_registry, mocker):
    mocker.patch("nexyn.cognee_client.forget", new_callable=AsyncMock)
    engine = ConsolidationEngine(seeded_registry)
    
    settings.prune_floor = 0.0
    await engine.sweep_once("mock_tenant", "mock_user", "mock_cognee_key")
    
    from nexyn import cognee_client
    assert cognee_client.forget.called
    
    active = await seeded_registry.list_active("mock_tenant", "mock_user")
    assert len(active) == 3

@pytest.mark.asyncio
async def test_sweep_failure_marks_pending(seeded_registry, mocker):
    mock_forget = AsyncMock(side_effect=Exception("API down"))
    mocker.patch("nexyn.cognee_client.forget", new=mock_forget)
    
    engine = ConsolidationEngine(seeded_registry)
    
    # Fast retry for tests
    mocker.patch("tenacity.wait_exponential", return_value=0)
    
    await engine.sweep_once("mock_tenant", "mock_user", "mock_cognee_key")
    
    active = await seeded_registry.list_active("mock_tenant", "mock_user")
    assert len(active) == 5
    
    db_trace = next(t for t in active if "export" in t.text)
    assert db_trace.status == "pending_prune"

@pytest.mark.asyncio
async def test_dry_run_mode(seeded_registry, mocker):
    settings.consolidation_dry_run = True
    mock_forget = AsyncMock()
    mocker.patch("nexyn.cognee_client.forget", new=mock_forget)
    
    engine = ConsolidationEngine(seeded_registry)
    await engine.sweep_once("mock_tenant", "mock_user", "mock_cognee_key")
    
    assert not mock_forget.called
    active = await seeded_registry.list_active("mock_tenant", "mock_user")
    assert len(active) == 5
    settings.consolidation_dry_run = False
