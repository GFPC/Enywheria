import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_file_upload_and_deduplication(client: AsyncClient):
    file_content = b"Binary microchip schematic diagram for ESP32 controller"

    # Upload file 1
    files_1 = {"file": ("schematic.bin", file_content, "application/octet-stream")}
    data_1 = {"title": "ESP32 Schematic Sheet 1", "type": "schematic"}
    res_1 = await client.post("/api/v1/files/upload", files=files_1, data=data_1)
    assert res_1.status_code == 201
    item_1 = res_1.json()
    hash_1 = item_1["file_hash"]
    path_1 = item_1["file_path"]

    # Upload identical file content (File 2)
    files_2 = {"file": ("copy_schematic.bin", file_content, "application/octet-stream")}
    data_2 = {"title": "ESP32 Schematic Backup", "type": "schematic"}
    res_2 = await client.post("/api/v1/files/upload", files=files_2, data=data_2)
    assert res_2.status_code == 201
    item_2 = res_2.json()
    hash_2 = item_2["file_hash"]
    path_2 = item_2["file_path"]

    # Verify hashes and storage paths match (Deduplication achieved!)
    assert hash_1 == hash_2
    assert path_1 == path_2
    assert item_1["id"] != item_2["id"]

    # Download file 1
    download_res = await client.get(f"/api/v1/files/{item_1['id']}")
    assert download_res.status_code == 200
    assert download_res.content == file_content


@pytest.mark.asyncio
async def test_file_encrypted_upload(client: AsyncClient):
    secret_bytes = b"Top secret private RSA key content"
    files = {"file": ("secret.key", secret_bytes, "application/octet-stream")}
    data = {"title": "Secret Key", "type": "other", "is_encrypted": "true"}

    res = await client.post("/api/v1/files/upload", files=files, data=data)
    assert res.status_code == 201
    item = res.json()
    assert item["is_encrypted"] is True

    # Download and verify decryption works transparently
    download_res = await client.get(f"/api/v1/files/{item['id']}")
    assert download_res.status_code == 200
    assert download_res.content == secret_bytes
