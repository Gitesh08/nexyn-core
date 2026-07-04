import pytest
from httpx import ASGITransport, AsyncClient
from nexyn.ingestion import IngestPayload, normalize, duplicate_cache
from main import app

@pytest.fixture(autouse=True)
def reset_state():
    duplicate_cache._seen.clear()

@pytest.mark.asyncio
async def test_ingest_valid():
    headers = {
        "x-tenant-id": "test_tenant",
        "x-user-id": "test_user",
        "x-nim-key": "mock_nim_key",
        "x-cognee-key": "mock_cognee_key"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/nexyn/ingest", json={"text": "hello world"}, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "processed"
    assert len(data["results"]) == 1
    assert data["results"][0]["status"] == "evaluating"

@pytest.mark.asyncio
async def test_ingest_duplicate():
    headers = {
        "x-tenant-id": "test_tenant",
        "x-user-id": "test_user",
        "x-nim-key": "mock_nim_key",
        "x-cognee-key": "mock_cognee_key"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.post("/nexyn/ingest", json={"text": "repeat me"}, headers=headers)
        assert res1.status_code == 200
        assert res1.json()["results"][0]["status"] == "evaluating"
        
        res2 = await ac.post("/nexyn/ingest", json={"text": "repeat me"}, headers=headers)
        assert res2.status_code == 200
        assert res2.json()["results"][0]["status"] == "dropped"

@pytest.mark.asyncio
async def test_ingest_empty():
    headers = {
        "x-tenant-id": "test_tenant",
        "x-user-id": "test_user",
        "x-nim-key": "mock_nim_key",
        "x-cognee-key": "mock_cognee_key"
    }
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/nexyn/ingest", json={"text": ""}, headers=headers)
    assert response.status_code == 422
