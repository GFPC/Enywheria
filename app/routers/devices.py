import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.device import DeviceCreate, DevicePingResult, DeviceRead, DeviceUpdate
from app.services.device_service import DeviceService

router = APIRouter(prefix="/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceRead])
async def list_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    devices = await service.list_devices(skip=skip, limit=limit)
    return [DeviceRead.model_validate(d) for d in devices]


@router.get("/{device_id}", response_model=DeviceRead)
async def get_device(
    device_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    device = await service.get_device(device_id)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return DeviceRead.model_validate(device)


@router.post("", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
async def create_device(
    data: DeviceCreate,
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    device = await service.create_device(data)
    return DeviceRead.model_validate(device)


@router.patch("/{device_id}", response_model=DeviceRead)
async def update_device(
    device_id: uuid.UUID,
    data: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    device = await service.update_device(device_id, data)
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return DeviceRead.model_validate(device)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_device(
    device_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = DeviceService(db)
    success = await service.delete_device(device_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")


@router.post("/{device_id}/ping", response_model=DevicePingResult)
async def ping_device(
    device_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Ping device to check online status."""
    service = DeviceService(db)
    return await service.ping_device(device_id)


@router.post("/{device_id}/wake")
async def wake_device(
    device_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Send Wake-on-LAN signal."""
    service = DeviceService(db)
    message = await service.wake_device(device_id)
    return {"message": message}
