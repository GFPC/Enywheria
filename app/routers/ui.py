from pathlib import Path
from fastapi import APIRouter, Depends, Request
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.item_service import ItemService
from app.services.note_service import NoteService
from app.services.device_service import DeviceService
from app.services.box_service import BoxService

templates_dir = Path(__file__).resolve().parent.parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))

router = APIRouter(tags=["Web UI"])


@router.get("/")
async def dashboard(request: Request, db: AsyncSession = Depends(get_db)):
    """Render Web UI Dashboard."""
    item_service = ItemService(db)
    note_service = NoteService(db)
    device_service = DeviceService(db)
    box_service = BoxService(db)

    items, items_count = await item_service.list_items(limit=10)
    notes = await note_service.list_notes(limit=10)
    devices = await device_service.list_devices(limit=10)
    boxes = await box_service.list_boxes(limit=10)

    return templates.TemplateResponse(
        "dashboard.html",
        {
            "request": request,
            "items": items,
            "items_count": items_count,
            "notes": notes,
            "devices": devices,
            "boxes": boxes,
        },
    )
