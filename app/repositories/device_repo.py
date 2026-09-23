import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.device import Device
from app.models.tag import Tag
from app.repositories.base import BaseRepository


class DeviceRepository(BaseRepository[Device]):
    def __init__(self, session: AsyncSession):
        super().__init__(Device, session)

    async def set_tags(self, device: Device, tag_ids: List[uuid.UUID]):
        """Associate tags with device."""
        if not tag_ids:
            device.tags = []
            return
        result = await self.session.execute(select(Tag).where(Tag.id.in_(tag_ids)))
        tags = result.scalars().all()
        device.tags = list(tags)
