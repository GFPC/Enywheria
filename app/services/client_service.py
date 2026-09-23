import uuid
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate
from app.repositories.client_repo import ClientRepository


class ClientService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.client_repo = ClientRepository(session)

    async def create_client(self, data: ClientCreate) -> Client:
        client = Client(
            name=data.name,
            contact=data.contact,
            notes=data.notes,
        )
        client = await self.client_repo.create(client)
        await self.session.commit()
        return client

    async def get_client(self, client_id: uuid.UUID) -> Optional[Client]:
        return await self.client_repo.get_by_id(client_id)

    async def list_clients(self, skip: int = 0, limit: int = 100) -> Sequence[Client]:
        return await self.client_repo.list_all(skip=skip, limit=limit)

    async def update_client(
        self, client_id: uuid.UUID, data: ClientUpdate
    ) -> Optional[Client]:
        client = await self.client_repo.get_by_id(client_id)
        if not client:
            return None
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(client, key, value)
        client = await self.client_repo.update(client)
        await self.session.commit()
        return client

    async def delete_client(self, client_id: uuid.UUID) -> bool:
        success = await self.client_repo.delete(client_id)
        if success:
            await self.session.commit()
        return success
