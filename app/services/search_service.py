from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.search_repo import SearchRepository
from app.schemas.search import SearchResponse, SuggestionResponse


class SearchService:
    def __init__(self, session: AsyncSession):
        self.search_repo = SearchRepository(session)

    async def search(
        self,
        query: str,
        item_type: Optional[str] = None,
        limit: int = 50,
    ) -> SearchResponse:
        """Unified full-text search with FTS5, entity fallback, and RapidFuzz ranking."""
        if not query or not query.strip():
            return SearchResponse(query=query, total=0, results=[])

        # FTS search on Items
        item_results = await self.search_repo.fts_search_items(
            query.strip(), item_type=item_type, limit=limit
        )

        # Additional entity search (Notes & Scripts) unless restricted to specific item_type
        other_results = []
        if not item_type or item_type in ("note", "script"):
            other_results = await self.search_repo.search_notes_and_scripts(
                query.strip(), limit=20
            )

        all_results = item_results + other_results

        # Perform fuzzy re-ranking using RapidFuzz
        ranked_results = await self.search_repo.fuzzy_rank(query.strip(), all_results)

        return SearchResponse(
            query=query,
            total=len(ranked_results),
            results=ranked_results[:limit],
        )

    async def suggest(self, query: str, limit: int = 10) -> SuggestionResponse:
        """Get autocompletion suggestions for live search UI."""
        if not query or not query.strip():
            return SuggestionResponse(query=query, suggestions=[])

        suggestions = await self.search_repo.get_suggestions(query.strip(), limit=limit)
        return SuggestionResponse(query=query, suggestions=suggestions)
