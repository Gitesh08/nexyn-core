import pytest
from httpx import ASGITransport, AsyncClient
from nexyn.router import ingest_queue
from nexyn.ingestion import IngestPayload, normalize, duplicate_cache
from main import app

@pytest.fixture(autouse=True)
def reset_state():
    while not ingest_queue.empty():
        ingest_queue.get_nowait()
    duplicate_cache._seen.clear()

@pytest.mark.asyncio
async def test_ingest_valid():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/nexyn/ingest", json={"text": "hello world"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert "hash" in data
    assert ingest_queue.qsize() == 1

@pytest.mark.asyncio
async def test_ingest_duplicate():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.post("/nexyn/ingest", json={"text": "repeat me"})
        assert res1.status_code == 200
        assert res1.json()["status"] == "queued"
        
        res2 = await ac.post("/nexyn/ingest", json={"text": "repeat me"})
        assert res2.status_code == 200
        assert res2.json()["status"] == "duplicate"
    
    # Only one should be enqueued
    assert ingest_queue.qsize() == 1

@pytest.mark.asyncio
async def test_ingest_empty():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/nexyn/ingest", json={"text": ""})
    assert response.status_code == 422
