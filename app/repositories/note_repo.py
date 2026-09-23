import uuid
from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.note import Note
from app.models.tag import Tag
from app.repositories.base import BaseRepository


class NoteRepository(BaseRepository[Note]):
    def __init__(self, session: AsyncSession):
        super().__init__(Note, session)

    async def set_tags(self, note: Note, tag_ids: List[uuid.UUID]):
        if not tag_ids:
            note.tags = []
            return
        result = await self.session.execute(select(Tag).where(Tag.id.in_(tag_ids)))
        tags = result.scalars().all()
        note.tags = list(tags)
