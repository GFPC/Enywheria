import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_notes_and_tags(client: AsyncClient):
    # Create tag
    tag_res = await client.post("/api/v1/tags", json={"name": "python", "color": "#3572A5"})
    assert tag_res.status_code == 201
    tag_id = tag_res.json()["id"]

    # Create note linked to tag
    note_payload = {
        "title": "AsyncIO Event Loop Deep Dive",
        "body": "# AsyncIO in Python 3.11\nDetailed notes on coroutines and tasks.",
        "tag_ids": [tag_id],
    }
    note_res = await client.post("/api/v1/notes", json=note_payload)
    assert note_res.status_code == 201
    note = note_res.json()
    assert note["title"] == note_payload["title"]
    assert len(note["tags"]) == 1
    assert note["tags"][0]["id"] == tag_id
