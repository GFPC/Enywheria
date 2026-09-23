import uuid
from typing import List, Optional
from pydantic import BaseModel, Field


class SearchResultItem(BaseModel):
    id: uuid.UUID
    entity_type: str  # item, note, script
    title: str
    content_snippet: Optional[str] = None
    item_type: Optional[str] = None
    score: float = 1.0


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResultItem]


class SuggestionItem(BaseModel):
    text: str
    entity_type: str
    id: uuid.UUID


class SuggestionResponse(BaseModel):
    query: str
    suggestions: List[SuggestionItem]
