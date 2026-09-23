from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int
