import uuid
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.tag import Tag
from app.schemas.tag import TagCreate, TagUpdate
from app.repositories.tag_repo import TagRepository


class TagService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.tag_repo = TagRepository(session)

    async def create_tag(self, data: TagCreate) -> Tag:
        tag = Tag(name=data.name, color=data.color, parent_id=data.parent_id)
        tag = await self.tag_repo.create(tag)
        await self.session.commit()
        return tag

    async def get_tag(self, tag_id: uuid.UUID) -> Optional[Tag]:
        return await self.tag_repo.get_by_id(tag_id)

    async def list_tags(self, skip: int = 0, limit: int = 100) -> Sequence[Tag]:
        return await self.tag_repo.list_all(skip=skip, limit=limit)

    async def update_tag(self, tag_id: uuid.UUID, data: TagUpdate) -> Optional[Tag]:
        tag = await self.tag_repo.get_by_id(tag_id)
        if not tag:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(tag, key, value)
        tag = await self.tag_repo.update(tag)
        await self.session.commit()
        return tag

    async def delete_tag(self, tag_id: uuid.UUID) -> bool:
        success = await self.tag_repo.delete(tag_id)
        if success:
            await self.session.commit()
        return success
