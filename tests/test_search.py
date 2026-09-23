import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_fulltext_and_fuzzy_search(client: AsyncClient):
    # 1. Create items
    await client.post(
        "/api/v1/items",
        json={"title": "Quantum Physics Notes", "content": "Schrodinger equation wave function"},
    )
    await client.post(
        "/api/v1/items",
        json={"title": "FastAPI Web Server", "content": "Uvicorn async ASGI python framework"},
    )

    # 2. Search for "Schrodinger"
    search_res = await client.get("/api/v1/search?q=Schrodinger")
    assert search_res.status_code == 200
    data = search_res.json()
    assert data["total"] >= 1
    assert any("Quantum" in item["title"] for item in data["results"])

    # 3. Autocompletion suggestion
    suggest_res = await client.get("/api/v1/search/suggest?q=Fast")
    assert suggest_res.status_code == 200
    sugg_data = suggest_res.json()
    assert len(sugg_data["suggestions"]) >= 1
    assert any("FastAPI" in s["text"] for s in sugg_data["suggestions"])
