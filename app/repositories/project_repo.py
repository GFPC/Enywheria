import uuid
from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.project import Project, ProjectStatus
from app.repositories.base import BaseRepository


class ProjectRepository(BaseRepository[Project]):
    def __init__(self, session: AsyncSession):
        super().__init__(Project, session)

    async def list_by_status(self, status: ProjectStatus) -> Sequence[Project]:
        query = select(Project).where(Project.status == status).order_by(Project.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()
