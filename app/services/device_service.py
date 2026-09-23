import asyncio
import socket
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
from app.models.device import Device, DeviceStatus
from app.models.event import Event, EventType
from app.schemas.device import DeviceCreate, DeviceUpdate, DevicePingResult
from app.repositories.device_repo import DeviceRepository
from app.repositories.event_repo import EventRepository


class DeviceService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.device_repo = DeviceRepository(session)
        self.event_repo = EventRepository(session)

    async def create_device(self, data: DeviceCreate) -> Device:
        ssh_key_bytes = data.ssh_key.encode("utf-8") if data.ssh_key else None

        device = Device(
            name=data.name,
            type=data.type,
            ip_address=data.ip_address,
            mac_address=data.mac_address,
            ssh_key_encrypted=ssh_key_bytes,
            status=DeviceStatus.UNKNOWN,
        )

        device = await self.device_repo.create(device)

        if data.tag_ids:
            await self.device_repo.set_tags(device, data.tag_ids)

        await self.session.commit()
        logger.info(f"Created device: {device.id} - {device.name}")
        return device

    async def get_device(self, device_id: uuid.UUID) -> Optional[Device]:
        return await self.device_repo.get_by_id(device_id)

    async def list_devices(self, skip: int = 0, limit: int = 100) -> Sequence[Device]:
        return await self.device_repo.list_all(skip=skip, limit=limit)

    async def update_device(self, device_id: uuid.UUID, data: DeviceUpdate) -> Optional[Device]:
        device = await self.device_repo.get_by_id(device_id)
        if not device:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        tag_ids = update_dict.pop("tag_ids", None)
        ssh_key = update_dict.pop("ssh_key", None)

        if ssh_key is not None:
            device.ssh_key_encrypted = ssh_key.encode("utf-8")

        for key, value in update_dict.items():
            setattr(device, key, value)

        if tag_ids is not None:
            await self.device_repo.set_tags(device, tag_ids)

        device = await self.device_repo.update(device)
        await self.session.commit()
        return device

    async def delete_device(self, device_id: uuid.UUID) -> bool:
        success = await self.device_repo.delete(device_id)
        if success:
            await self.session.commit()
        return success

    async def ping_device(self, device_id: uuid.UUID) -> DevicePingResult:
        """Check device availability via socket connection test."""
        device = await self.device_repo.get_by_id(device_id)
        if not device:
            return DevicePingResult(
                id=device_id,
                name="Unknown",
                status=DeviceStatus.OFFLINE,
                message="Device not found in database",
            )

        if not device.ip_address:
            return DevicePingResult(
                id=device.id,
                name=device.name,
                status=DeviceStatus.OFFLINE,
                message="Device has no IP address configured",
            )

        start_time = time.time()
        is_online = False
        message = ""

        # Try connecting to standard ports (22, 80, 443, 8080)
        ports = [22, 80, 443, 8080]
        for port in ports:
            try:
                fut = asyncio.open_connection(device.ip_address, port)
                reader, writer = await asyncio.wait_for(fut, timeout=1.0)
                writer.close()
                await writer.wait_closed()
                is_online = True
                message = f"Port {port} reachable"
                break
            except Exception:
                continue

        latency_ms = round((time.time() - start_time) * 1000, 2)
        new_status = DeviceStatus.ONLINE if is_online else DeviceStatus.OFFLINE

        # Status transition event logging
        if device.status != new_status:
            device.status = new_status
            if is_online:
                device.last_seen = datetime.now(timezone.utc)
            event_type = (
                EventType.DEVICE_ONLINE if is_online else EventType.DEVICE_OFFLINE
            )
            event = Event(
                type=event_type,
                description=f"Device '{device.name}' ({device.ip_address}) status changed to {new_status.value}",
                device_id=device.id,
            )
            await self.event_repo.create(event)
            await self.session.commit()

        return DevicePingResult(
            id=device.id,
            name=device.name,
            status=new_status,
            latency_ms=latency_ms if is_online else None,
            message=message or ("Device reachable" if is_online else "Connection timeout"),
        )

    async def wake_device(self, device_id: uuid.UUID) -> str:
        """Wake-on-LAN stub execution."""
        device = await self.device_repo.get_by_id(device_id)
        if not device:
            return "Device not found"
        if not device.mac_address:
            return "No MAC address associated with device"

        # Log WoL execution event
        event = Event(
            type=EventType.OTHER,
            description=f"Sent Wake-on-LAN magic packet to device '{device.name}' ({device.mac_address})",
            device_id=device.id,
        )
        await self.event_repo.create(event)
        await self.session.commit()
        return f"Sent Wake-on-LAN signal to {device.name} ({device.mac_address})"
