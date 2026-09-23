import uuid
from typing import List, Optional
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.item import Item
from app.models.note import Note
from app.models.script import Script
from app.schemas.search import SearchResultItem, SuggestionItem

try:
    from rapidfuzz import fuzz
    HAS_RAPIDFUZZ = True
except ImportError:
    HAS_RAPIDFUZZ = False


class SearchRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def fts_search_items(
        self, query_str: str, item_type: Optional[str] = None, limit: int = 50
    ) -> List[SearchResultItem]:
        """Execute SQLite FTS5 MATCH search on item_fts table."""
        sanitized_query = query_str.replace("'", "''").replace('"', '""')
        sql = text(
            """
            SELECT i.id, i.title, i.content, i.type, fts.rank
            FROM item_fts fts
            JOIN items i ON fts.rowid = i.rowid
            WHERE item_fts MATCH :match_query
            AND i.deleted_at IS NULL
            ORDER BY fts.rank
            LIMIT :limit
            """
        )
        try:
            result = await self.session.execute(
                sql, {"match_query": f"{sanitized_query}*", "limit": limit}
            )
            rows = result.fetchall()

            results = []
            for row in rows:
                item_id, title, content, type_val, rank = row
                if item_type and str(type_val) != item_type:
                    continue
                snippet = (content[:150] + "...") if content and len(content) > 150 else content
                results.append(
                    SearchResultItem(
                        id=uuid.UUID(str(item_id)) if isinstance(item_id, str) else item_id,
                        entity_type="item",
                        title=title,
                        content_snippet=snippet,
                        item_type=str(type_val),
                        score=float(abs(rank)) if rank is not None else 1.0,
                    )
                )
            return results
        except Exception:
            # Fallback to standard SQL ILIKE search if FTS syntax error or table missing
            return await self.fallback_ilike_search(query_str, item_type, limit)

    async def fallback_ilike_search(
        self, query_str: str, item_type: Optional[str] = None, limit: int = 50
    ) -> List[SearchResultItem]:
        """Fallback search using SQL ILIKE pattern matching."""
        query = select(Item).where(Item.deleted_at.is_(None))
        if item_type:
            query = query.where(Item.type == item_type)
        query = query.where(
            Item.title.ilike(f"%{query_str}%") | Item.content.ilike(f"%{query_str}%")
        ).limit(limit)

        items = (await self.session.execute(query)).scalars().all()

        results = []
        for item in items:
            snippet = (
                (item.content[:150] + "...")
                if item.content and len(item.content) > 150
                else item.content
            )
            results.append(
                SearchResultItem(
                    id=item.id,
                    entity_type="item",
                    title=item.title,
                    content_snippet=snippet,
                    item_type=str(item.type.value),
                    score=1.0,
                )
            )
        return results

    async def search_notes_and_scripts(
        self, query_str: str, limit: int = 20
    ) -> List[SearchResultItem]:
        """Search across Notes and Scripts entities."""
        results: List[SearchResultItem] = []

        # Notes
        note_stmt = (
            select(Note)
            .where(
                Note.title.ilike(f"%{query_str}%") | Note.body.ilike(f"%{query_str}%")
            )
            .limit(limit)
        )
        notes = (await self.session.execute(note_stmt)).scalars().all()
        for note in notes:
            snippet = (note.body[:150] + "...") if len(note.body) > 150 else note.body
            results.append(
                SearchResultItem(
                    id=note.id,
                    entity_type="note",
                    title=note.title,
                    content_snippet=snippet,
                    score=0.9,
                )
            )

        # Scripts
        script_stmt = (
            select(Script)
            .where(
                Script.name.ilike(f"%{query_str}%")
                | Script.description.ilike(f"%{query_str}%")
                | Script.body.ilike(f"%{query_str}%")
            )
            .limit(limit)
        )
        scripts = (await self.session.execute(script_stmt)).scalars().all()
        for script in scripts:
            snippet = script.description or (
                script.body[:150] + "..." if len(script.body) > 150 else script.body
            )
            results.append(
                SearchResultItem(
                    id=script.id,
                    entity_type="script",
                    title=f"[{script.language}] {script.name}",
                    content_snippet=snippet,
                    score=0.85,
                )
            )

        return results

    async def fuzzy_rank(
        self, query_str: str, results: List[SearchResultItem]
    ) -> List[SearchResultItem]:
        """Re-rank search results using rapidfuzz token_sort_ratio if available."""
        if not results:
            return []

        if not HAS_RAPIDFUZZ:
            return results

        scored_results = []
        for item in results:
            text_to_match = f"{item.title} {item.content_snippet or ''}"
            ratio = fuzz.token_sort_ratio(query_str, text_to_match)
            combined_score = round(item.score * 0.4 + (ratio / 100.0) * 0.6, 2)
            item.score = combined_score
            scored_results.append(item)

        scored_results.sort(key=lambda x: x.score, reverse=True)
        return scored_results

    async def get_suggestions(
        self, query_str: str, limit: int = 10
    ) -> List[SuggestionItem]:
        """Autocompletion suggestions across Items, Notes, and Scripts."""
        suggestions: List[SuggestionItem] = []

        # Items
        item_stmt = (
            select(Item.id, Item.title)
            .where(Item.deleted_at.is_(None), Item.title.ilike(f"%{query_str}%"))
            .limit(limit)
        )
        items = (await self.session.execute(item_stmt)).all()
        for item_id, title in items:
            suggestions.append(
                SuggestionItem(text=title, entity_type="item", id=item_id)
            )

        # Notes
        note_stmt = (
            select(Note.id, Note.title)
            .where(Note.title.ilike(f"%{query_str}%"))
            .limit(limit)
        )
        notes = (await self.session.execute(note_stmt)).all()
        for note_id, title in notes:
            suggestions.append(
                SuggestionItem(text=title, entity_type="note", id=note_id)
            )

        # Scripts
        script_stmt = (
            select(Script.id, Script.name)
            .where(Script.name.ilike(f"%{query_str}%"))
            .limit(limit)
        )
        scripts = (await self.session.execute(script_stmt)).all()
        for script_id, name in scripts:
            suggestions.append(
                SuggestionItem(text=name, entity_type="script", id=script_id)
            )

        return suggestions[:limit]
