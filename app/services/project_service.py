import uuid
from typing import Optional, Sequence
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.project import Project, ProjectStatus
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.repositories.project_repo import ProjectRepository


class ProjectService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.project_repo = ProjectRepository(session)

    async def create_project(self, data: ProjectCreate) -> Project:
        project = Project(
            name=data.name,
            description=data.description,
            status=data.status,
            started_at=data.started_at or datetime.now(timezone.utc),
            deadline=data.deadline,
            client_id=data.client_id,
        )
        project = await self.project_repo.create(project)
        await self.session.commit()
        return project

    async def get_project(self, project_id: uuid.UUID) -> Optional[Project]:
        return await self.project_repo.get_by_id(project_id)

    async def list_projects(self, skip: int = 0, limit: int = 100) -> Sequence[Project]:
        return await self.project_repo.list_all(skip=skip, limit=limit)

    async def update_project(
        self, project_id: uuid.UUID, data: ProjectUpdate
    ) -> Optional[Project]:
        project = await self.project_repo.get_by_id(project_id)
        if not project:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(project, key, value)
        project = await self.project_repo.update(project)
        await self.session.commit()
        return project

    async def delete_project(self, project_id: uuid.UUID) -> bool:
        success = await self.project_repo.delete(project_id)
        if success:
            await self.session.commit()
        return success
