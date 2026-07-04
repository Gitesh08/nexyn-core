import pytest
import asyncio
from unittest.mock import AsyncMock
from nexyn.retrieval_engine import RetrievalEngine
from nexyn.models import RecallRequest
from nexyn.config import settings

@pytest.mark.asyncio
async def test_retrieval_empty_graph(seeded_registry, mocker):
    mocker.patch("nexyn.cognee_client.search_chunks", new_callable=AsyncMock, return_value=[])
    engine = RetrievalEngine(seeded_registry)
    
    req = RecallRequest(query="hello")
    result = await engine.recall(req, "mock_tenant", "mock_user", "mock_nim_key", "mock_cognee_key")
    assert len(result.matches) == 0

@pytest.mark.asyncio
async def test_retrieval_filters_pruned(seeded_registry, mocker):
    traces = await seeded_registry.list_active("mock_tenant", "mock_user")
    assert len(traces) > 0
    node_id_to_prune = traces[0].node_id
    await seeded_registry.mark_pruned(node_id_to_prune)
    
    mock_recall = AsyncMock(return_value=[
        {
            "text": t.text,
            "nexyn_meta": {
                "valence": t.valence_score,
                "w_initial": t.weight_initial,
                "decay_rate": t.decay_rate,
                "created_at": t.created_at.isoformat()
            },
            "raw": {"id": t.node_id},
            "score": 0.9
        } for t in traces
    ])
    mocker.patch("nexyn.cognee_client.search_chunks", new=mock_recall)
    
    engine = RetrievalEngine(seeded_registry)
    req = RecallRequest(query="test", top_k=10)
    result = await engine.recall(req, "mock_tenant", "mock_user", "mock_nim_key", "mock_cognee_key")
    
    assert len(result.matches) == len(traces) - 1
    assert all(m.node_id != node_id_to_prune for m in result.matches)

@pytest.mark.asyncio
async def test_retrieval_timeout(seeded_registry, mocker):
    async def slow_recall(*args, **kwargs):
        await asyncio.sleep(2.0)
        return []
        
    mocker.patch("nexyn.cognee_client.search_chunks", new=slow_recall)
    settings.retrieval_timeout_seconds = 0.1
    
    engine = RetrievalEngine(seeded_registry)
    req = RecallRequest(query="test")
    result = await engine.recall(req, "mock_tenant", "mock_user", "mock_nim_key", "mock_cognee_key")
    assert result.is_timeout
    assert result.error == "timeout"
    settings.retrieval_timeout_seconds = 5.0 # reset

@pytest.mark.asyncio
async def test_retrieval_cache(seeded_registry, mocker):
    mock_recall = AsyncMock(return_value=[])
    mocker.patch("nexyn.cognee_client.search_chunks", new=mock_recall)
    
    engine = RetrievalEngine(seeded_registry)
    req = RecallRequest(query="cache_test")
    
    await engine.recall(req, "mock_tenant", "mock_user", "mock_nim_key", "mock_cognee_key")
    assert mock_recall.call_count == 1
    
    await engine.recall(req, "mock_tenant", "mock_user", "mock_nim_key", "mock_cognee_key")
    assert mock_recall.call_count == 1

@pytest.mark.asyncio
async def test_reinforce(seeded_registry, mocker):
    mock_improve = AsyncMock()
    mocker.patch("nexyn.cognee_client.improve", new=mock_improve)
    
    traces = await seeded_registry.list_active("mock_tenant", "mock_user")
    node_id = traces[0].node_id
    old_time = traces[0].last_accessed
    
    engine = RetrievalEngine(seeded_registry)
    await engine.reinforce(node_id)
    
    updated_trace = await seeded_registry.get(node_id)
    assert updated_trace.last_accessed > old_time
