import uuid
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.item import ItemType
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate
from app.schemas.common import PaginatedResponse
from app.services.item_service import ItemService

router = APIRouter(prefix="/items", tags=["Items"])


@router.get("", response_model=PaginatedResponse[ItemRead])
async def list_items(
    type: Optional[ItemType] = Query(None, description="Filter by item type"),
    tag_id: Optional[uuid.UUID] = Query(None, description="Filter by tag ID"),
    collection_id: Optional[uuid.UUID] = Query(None, description="Filter by collection ID"),
    project_id: Optional[uuid.UUID] = Query(None, description="Filter by project ID"),
    box_id: Optional[uuid.UUID] = Query(None, description="Filter by box ID"),
    q: Optional[str] = Query(None, description="Search query string"),
    include_deleted: bool = Query(False, description="Include soft-deleted items"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve items with optional filtering and pagination."""
    service = ItemService(db)
    skip = (page - 1) * size
    items, total = await service.list_items(
        item_type=type,
        tag_id=tag_id,
        collection_id=collection_id,
        project_id=project_id,
        box_id=box_id,
        search_query=q,
        include_deleted=include_deleted,
        skip=skip,
        limit=size,
    )
    pages = math.ceil(total / size) if total > 0 else 0
    return PaginatedResponse[ItemRead](
        items=[ItemRead.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{item_id}", response_model=ItemRead)
async def get_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get active item by ID."""
    service = ItemService(db)
    item = await service.get_item(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item '{item_id}' not found",
        )
    return ItemRead.model_validate(item)


@router.post("", response_model=ItemRead, status_code=status.HTTP_201_CREATED)
async def create_item(
    data: ItemCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new item."""
    service = ItemService(db)
    item = await service.create_item(data)
    return ItemRead.model_validate(item)


@router.patch("/{item_id}", response_model=ItemRead)
async def update_item(
    item_id: uuid.UUID,
    data: ItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing item."""
    service = ItemService(db)
    item = await service.update_item(item_id, data)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item '{item_id}' not found",
        )
    return ItemRead.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Soft-delete an item."""
    service = ItemService(db)
    success = await service.soft_delete_item(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item '{item_id}' not found or already deleted",
        )


@router.post("/{item_id}/restore", response_model=ItemRead)
async def restore_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Restore a soft-deleted item."""
    service = ItemService(db)
    success = await service.restore_item(item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item '{item_id}' not found or not deleted",
        )
    item = await service.get_item(item_id)
    return ItemRead.model_validate(item)
