import asyncio
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from app.database import async_session_factory
from app.services.item_service import ItemService
from app.services.note_service import NoteService
from app.services.device_service import DeviceService
from app.services.script_service import ScriptService
from app.p2p.node import P2PNode


class P2PVaultSync:
    """High-level vault synchronization and remote RPC over P2P connection."""

    def __init__(self, p2p_node: P2PNode):
        self.node = p2p_node
        self.node.on_message_callback = self.handle_p2p_request

    async def handle_p2p_request_async(self, sender: str, payload: Dict[str, Any], mode: str):
        """Process incoming P2P requests and handle commands."""
        cmd = payload.get("cmd")
        logger.info(f"[P2P Sync via {mode}] Received command '{cmd}' from peer '{sender}'")

        if not cmd:
            return

        async with async_session_factory() as session:
            if cmd == "list_items":
                service = ItemService(session)
                items, total = await service.list_items(limit=20)
                items_data = [{"id": str(i.id), "title": i.title, "type": i.type.value} for i in items]
                await self.node.send_message(sender, {"resp": "list_items", "items": items_data, "total": total})

            elif cmd == "list_notes":
                service = NoteService(session)
                notes = await service.list_notes(limit=20)
                notes_data = [{"id": str(n.id), "title": n.title, "body": n.body[:100]} for n in notes]
                await self.node.send_message(sender, {"resp": "list_notes", "notes": notes_data})

            elif cmd == "ping_device":
                device_id = payload.get("device_id")
                if device_id:
                    service = DeviceService(session)
                    res = await service.ping_device(device_id)
                    await self.node.send_message(sender, {"resp": "ping_device", "result": res.model_dump()})

            elif cmd == "run_script":
                script_id = payload.get("script_id")
                if script_id:
                    service = ScriptService(session)
                    res = await service.run_script(script_id)
                    await self.node.send_message(sender, {"resp": "run_script", "result": res.model_dump()})

    def handle_p2p_request(self, sender: str, payload: Dict[str, Any], mode: str):
        """Synchronous wrapper callback for event loop."""
        asyncio.create_task(self.handle_p2p_request_async(sender, payload, mode))
