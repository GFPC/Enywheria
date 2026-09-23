import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.tag import TagCreate, TagRead, TagUpdate
from app.services.tag_service import TagService

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("", response_model=List[TagRead])
async def list_tags(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    tags = await service.list_tags(skip=skip, limit=limit)
    return [TagRead.model_validate(t) for t in tags]


@router.get("/{tag_id}", response_model=TagRead)
async def get_tag(
    tag_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    tag = await service.get_tag(tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return TagRead.model_validate(tag)


@router.post("", response_model=TagRead, status_code=status.HTTP_201_CREATED)
async def create_tag(
    data: TagCreate,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    tag = await service.create_tag(data)
    return TagRead.model_validate(tag)


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: uuid.UUID,
    data: TagUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    tag = await service.update_tag(tag_id, data)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return TagRead.model_validate(tag)


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = TagService(db)
    success = await service.delete_tag(tag_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
