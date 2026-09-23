import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_get_item(client: AsyncClient):
    # 1. Create item
    payload = {
        "title": "ESP32 WiFi Gateway Firmware",
        "type": "firmware",
        "content": "C++ source code for ESP32 MQTT router gateway",
        "is_encrypted": False,
    }
    response = await client.post("/api/v1/items", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["type"] == payload["type"]
    item_id = data["id"]

    # 2. Get item by ID
    get_res = await client.get(f"/api/v1/items/{item_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == item_id


@pytest.mark.asyncio
async def test_soft_delete_and_restore_item(client: AsyncClient):
    # Create item
    res = await client.post("/api/v1/items", json={"title": "Temporary Log", "type": "log"})
    item_id = res.json()["id"]

    # Soft delete item
    del_res = await client.delete(f"/api/v1/items/{item_id}")
    assert del_res.status_code == 204

    # Verify item is not returned by default list or get
    get_res = await client.get(f"/api/v1/items/{item_id}")
    assert get_res.status_code == 404

    # Restore item
    restore_res = await client.post(f"/api/v1/items/{item_id}/restore")
    assert restore_res.status_code == 200

    # Verify item is active again
    get_res_2 = await client.get(f"/api/v1/items/{item_id}")
    assert get_res_2.status_code == 200
    assert get_res_2.json()["deleted_at"] is None
