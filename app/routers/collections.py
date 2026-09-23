import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.collection import CollectionCreate, CollectionRead, CollectionUpdate
from app.services.collection_service import CollectionService

router = APIRouter(prefix="/collections", tags=["Collections"])


@router.get("", response_model=List[CollectionRead])
async def list_collections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = CollectionService(db)
    collections = await service.list_collections(skip=skip, limit=limit)
    return [CollectionRead.model_validate(c) for c in collections]


@router.get("/{collection_id}", response_model=CollectionRead)
async def get_collection(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = CollectionService(db)
    collection = await service.get_collection(collection_id)
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return CollectionRead.model_validate(collection)


@router.post("", response_model=CollectionRead, status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    db: AsyncSession = Depends(get_db),
):
    service = CollectionService(db)
    collection = await service.create_collection(data)
    return CollectionRead.model_validate(collection)


@router.patch("/{collection_id}", response_model=CollectionRead)
async def update_collection(
    collection_id: uuid.UUID,
    data: CollectionUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = CollectionService(db)
    collection = await service.update_collection(collection_id, data)
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return CollectionRead.model_validate(collection)


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = CollectionService(db)
    success = await service.delete_collection(collection_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
