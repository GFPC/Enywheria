from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.search import SearchResponse, SuggestionResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by item/entity type"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Full-text search across items, notes, and scripts with FTS5 and fuzzy re-ranking."""
    service = SearchService(db)
    return await service.search(query=q, item_type=type, limit=limit)


@router.get("/suggest", response_model=SuggestionResponse)
async def suggest(
    q: str = Query(..., min_length=1, description="Autocompletion prefix query"),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Live search suggestions autocompletion."""
    service = SearchService(db)
    return await service.suggest(query=q, limit=limit)
