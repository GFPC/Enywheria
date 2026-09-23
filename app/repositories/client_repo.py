from sqlalchemy.ext.asyncio import AsyncSession
from app.models.client import Client
from app.repositories.base import BaseRepository


class ClientRepository(BaseRepository[Client]):
    def __init__(self, session: AsyncSession):
        super().__init__(Client, session)
