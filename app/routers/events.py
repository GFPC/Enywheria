import uuid
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.event import EventType
from app.schemas.event import EventRead
from app.schemas.common import PaginatedResponse
from app.services.event_service import EventService

router = APIRouter(prefix="/events", tags=["Events"])


@router.get("", response_model=PaginatedResponse[EventRead])
async def list_events(
    type: Optional[EventType] = Query(None, description="Filter by event type"),
    item_id: Optional[uuid.UUID] = Query(None, description="Filter by item ID"),
    device_id: Optional[uuid.UUID] = Query(None, description="Filter by device ID"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    service = EventService(db)
    skip = (page - 1) * size
    events, total = await service.list_events(
        event_type=type,
        item_id=item_id,
        device_id=device_id,
        skip=skip,
        limit=size,
    )
    pages = math.ceil(total / size) if total > 0 else 0
    return PaginatedResponse[EventRead](
        items=[EventRead.model_validate(e) for e in events],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )
