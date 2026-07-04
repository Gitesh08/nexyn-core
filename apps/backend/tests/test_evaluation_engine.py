import pytest
from unittest.mock import AsyncMock
from datetime import datetime, timezone
from nexyn.evaluation_engine import EvaluationEngine
from nexyn.models import NormalizedPayload
from nexyn.valence import ValenceResult

@pytest.mark.asyncio
async def test_evaluate_score_1_dropped(seeded_registry, mocker):
    mocker.patch("nexyn.evaluation_engine.determine_valence", return_value=ValenceResult(score=1, reasoning="junk"))
    engine = EvaluationEngine(seeded_registry)
    payload = NormalizedPayload(text="ok", timestamp=123.0, content_hash="abc")
    
    await engine.evaluate(payload)
    # Shouldn't be in registry
    assert await seeded_registry.get("abc") is None

@pytest.mark.asyncio
async def test_evaluate_resonance_hit(seeded_registry, mocker):
    mocker.patch("nexyn.evaluation_engine.determine_valence", return_value=ValenceResult(score=3, reasoning="fact"))
    # Return a mocked resonance hit
    mocker.patch("nexyn.evaluation_engine.check_resonance", return_value={"raw": {"id": "existing-node"}})
    mock_touch = mocker.patch.object(seeded_registry, "touch_last_accessed", new_callable=AsyncMock)
    
    engine = EvaluationEngine(seeded_registry)
    payload = NormalizedPayload(text="already know this", timestamp=123.0, content_hash="abc")
    
    await engine.evaluate(payload)
    mock_touch.assert_called_once_with("existing-node")

@pytest.mark.asyncio
async def test_evaluate_new_memory(seeded_registry, mocker):
    mocker.patch("nexyn.evaluation_engine.determine_valence", return_value=ValenceResult(score=3, reasoning="fact"))
    mocker.patch("nexyn.evaluation_engine.check_resonance", return_value=None)
    
    # Mock cognee_client.remember
    class MockRememberResult:
        def __init__(self):
            self.items = [{"id": "cognee-uuid"}]
    
    mocker.patch("nexyn.cognee_client.remember", return_value=MockRememberResult())
    
    engine = EvaluationEngine(seeded_registry)
    payload = NormalizedPayload(text="new fact", timestamp=123.0, content_hash="abc")
    
    await engine.evaluate(payload)
    
    trace = await seeded_registry.get("cognee-uuid")
    assert trace is not None
    assert trace.valence_score == 3
    assert trace.status == "active"
