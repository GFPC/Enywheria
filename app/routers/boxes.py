import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.box import BoxCreate, BoxRead, BoxUpdate
from app.schemas.item import ItemRead
from app.services.box_service import BoxService

router = APIRouter(prefix="/boxes", tags=["Boxes"])


@router.get("", response_model=List[BoxRead])
async def list_boxes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = BoxService(db)
    boxes = await service.list_boxes(skip=skip, limit=limit)
    return [BoxRead.model_validate(b) for b in boxes]


@router.get("/{box_id}", response_model=BoxRead)
async def get_box(
    box_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = BoxService(db)
    box = await service.get_box(box_id)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Box not found")
    return BoxRead.model_validate(box)


@router.post("", response_model=BoxRead, status_code=status.HTTP_201_CREATED)
async def create_box(
    data: BoxCreate,
    db: AsyncSession = Depends(get_db),
):
    service = BoxService(db)
    box = await service.create_box(data)
    return BoxRead.model_validate(box)


@router.patch("/{box_id}", response_model=BoxRead)
async def update_box(
    box_id: uuid.UUID,
    data: BoxUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = BoxService(db)
    box = await service.update_box(box_id, data)
    if not box:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Box not found")
    return BoxRead.model_validate(box)


@router.delete("/{box_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_box(
    box_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = BoxService(db)
    success = await service.delete_box(box_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Box not found")


@router.get("/{box_id}/items", response_model=List[ItemRead])
async def get_box_items(
    box_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get items stored in the specified box."""
    service = BoxService(db)
    items = await service.get_box_items(box_id)
    return [ItemRead.model_validate(item) for item in items]
