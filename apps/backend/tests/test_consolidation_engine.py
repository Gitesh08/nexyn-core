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
    await engine.sweep_once()
    
    from nexyn import cognee_client
    assert cognee_client.forget.called
    
    active = await seeded_registry.list_active()
    assert len(active) == 3

@pytest.mark.asyncio
async def test_sweep_failure_marks_pending(seeded_registry, mocker):
    mock_forget = AsyncMock(side_effect=Exception("API down"))
    mocker.patch("nexyn.cognee_client.forget", new=mock_forget)
    
    engine = ConsolidationEngine(seeded_registry)
    
    # Fast retry for tests
    mocker.patch("tenacity.wait_exponential", return_value=0)
    
    await engine.sweep_once()
    
    active = await seeded_registry.list_active()
    assert len(active) == 5
    
    traces = seed_sample_memories()
    # The expected pruned one is score=2, w=20, 72 hours ago
    pruned_trace_id = next(t for t in traces if t.valence_score == 2 and t.weight_initial == 20.0 and (t.weight_initial - t.decay_rate*72) <= 0).node_id
    db_trace = await seeded_registry.get(pruned_trace_id)
    assert db_trace.status == "pending_prune"

@pytest.mark.asyncio
async def test_dry_run_mode(seeded_registry, mocker):
    settings.consolidation_dry_run = True
    mock_forget = AsyncMock()
    mocker.patch("nexyn.cognee_client.forget", new=mock_forget)
    
    engine = ConsolidationEngine(seeded_registry)
    await engine.sweep_once()
    
    assert not mock_forget.called
    active = await seeded_registry.list_active()
    assert len(active) == 5
    settings.consolidation_dry_run = False
