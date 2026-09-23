from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def get_health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": "0.1.0",
    }
