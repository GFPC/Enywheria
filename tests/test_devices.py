import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_device_crud_ping_and_script(client: AsyncClient):
    # 1. Create Device
    device_data = {
        "name": "Raspberry Pi 4",
        "type": "sbc",
        "ip_address": "127.0.0.1",
        "mac_address": "AA:BB:CC:DD:EE:FF",
    }
    dev_res = await client.post("/api/v1/devices", json=device_data)
    assert dev_res.status_code == 201
    device = dev_res.json()
    device_id = device["id"]

    # 2. Ping device
    ping_res = await client.post(f"/api/v1/devices/{device_id}/ping")
    assert ping_res.status_code == 200
    ping_data = ping_res.json()
    assert ping_data["id"] == device_id

    # 3. Create and Run Script
    script_data = {
        "name": "Check CPU Temperature",
        "language": "bash",
        "body": "vcgencmd measure_temp",
        "device_id": device_id,
    }
    scr_res = await client.post("/api/v1/scripts", json=script_data)
    assert scr_res.status_code == 201
    script_id = scr_res.json()["id"]

    run_res = await client.post(f"/api/v1/scripts/{script_id}/run")
    assert run_res.status_code == 200
    assert run_res.json()["success"] is True

    # 4. Check audit log event created
    events_res = await client.get(f"/api/v1/events?device_id={device_id}")
    assert events_res.status_code == 200
    events = events_res.json()["items"]
    assert len(events) >= 1
