import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.services.client_service import ClientService

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=List[ClientRead])
async def list_clients(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = ClientService(db)
    clients = await service.list_clients(skip=skip, limit=limit)
    return [ClientRead.model_validate(c) for c in clients]


@router.get("/{client_id}", response_model=ClientRead)
async def get_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ClientService(db)
    client = await service.get_client(client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientRead.model_validate(client)


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    db: AsyncSession = Depends(get_db),
):
    service = ClientService(db)
    client = await service.create_client(data)
    return ClientRead.model_validate(client)


@router.patch("/{client_id}", response_model=ClientRead)
async def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = ClientService(db)
    client = await service.update_client(client_id, data)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return ClientRead.model_validate(client)


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = ClientService(db)
    success = await service.delete_client(client_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
