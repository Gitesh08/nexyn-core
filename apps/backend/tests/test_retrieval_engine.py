import pytest
import asyncio
from unittest.mock import AsyncMock
from synapse.retrieval_engine import RetrievalEngine
from synapse.models import RecallRequest
from synapse.config import settings

@pytest.mark.asyncio
async def test_retrieval_empty_graph(seeded_registry, mocker):
    mocker.patch("synapse.cognee_client.recall", new_callable=AsyncMock, return_value=[])
    engine = RetrievalEngine(seeded_registry)
    
    req = RecallRequest(query="hello")
    result = await engine.recall(req)
    assert len(result.matches) == 0

@pytest.mark.asyncio
async def test_retrieval_filters_pruned(seeded_registry, mocker):
    traces = await seeded_registry.list_active()
    assert len(traces) > 0
    node_id_to_prune = traces[0].node_id
    await seeded_registry.mark_pruned(node_id_to_prune)
    
    mock_recall = AsyncMock(return_value=[{"id": t.node_id, "score": 0.9} for t in traces])
    mocker.patch("synapse.cognee_client.recall", new=mock_recall)
    
    engine = RetrievalEngine(seeded_registry)
    req = RecallRequest(query="test", top_k=10)
    result = await engine.recall(req)
    
    assert len(result.matches) == len(traces) - 1
    assert all(m.node_id != node_id_to_prune for m in result.matches)

@pytest.mark.asyncio
async def test_retrieval_timeout(seeded_registry, mocker):
    async def slow_recall(*args, **kwargs):
        await asyncio.sleep(2.0)
        return []
        
    mocker.patch("synapse.cognee_client.recall", new=slow_recall)
    settings.retrieval_timeout_seconds = 0.1
    
    engine = RetrievalEngine(seeded_registry)
    req = RecallRequest(query="test")
    result = await engine.recall(req)
    assert result.is_timeout
    assert result.error == "timeout"
    settings.retrieval_timeout_seconds = 5.0 # reset

@pytest.mark.asyncio
async def test_retrieval_cache(seeded_registry, mocker):
    mock_recall = AsyncMock(return_value=[])
    mocker.patch("synapse.cognee_client.recall", new=mock_recall)
    
    engine = RetrievalEngine(seeded_registry)
    req = RecallRequest(query="cache_test")
    
    await engine.recall(req)
    assert mock_recall.call_count == 1
    
    await engine.recall(req)
    assert mock_recall.call_count == 1

@pytest.mark.asyncio
async def test_reinforce(seeded_registry, mocker):
    mock_improve = AsyncMock()
    mocker.patch("synapse.cognee_client.improve", new=mock_improve)
    
    traces = await seeded_registry.list_active()
    node_id = traces[0].node_id
    old_time = traces[0].last_accessed
    
    engine = RetrievalEngine(seeded_registry)
    await engine.reinforce(node_id)
    
    assert mock_improve.called
    
    updated_trace = await seeded_registry.get(node_id)
    assert updated_trace.last_accessed > old_time
