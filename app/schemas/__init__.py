from app.schemas.common import ErrorDetail, ErrorResponse, PaginatedResponse
from app.schemas.tag import TagCreate, TagRead, TagUpdate
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate
from app.schemas.collection import CollectionCreate, CollectionRead, CollectionUpdate
from app.schemas.device import DeviceCreate, DevicePingResult, DeviceRead, DeviceUpdate
from app.schemas.script import ScriptCreate, ScriptRead, ScriptRunResult, ScriptUpdate
from app.schemas.box import BoxCreate, BoxRead, BoxUpdate
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.schemas.event import EventCreate, EventRead
from app.schemas.item import ItemCreate, ItemRead, ItemUpdate
from app.schemas.search import SearchResponse, SearchResultItem, SuggestionResponse, SuggestionItem

__all__ = [
    "ErrorDetail",
    "ErrorResponse",
    "PaginatedResponse",
    "TagCreate",
    "TagRead",
    "TagUpdate",
    "ClientCreate",
    "ClientRead",
    "ClientUpdate",
    "ProjectCreate",
    "ProjectRead",
    "ProjectUpdate",
    "CollectionCreate",
    "CollectionRead",
    "CollectionUpdate",
    "DeviceCreate",
    "DevicePingResult",
    "DeviceRead",
    "DeviceUpdate",
    "ScriptCreate",
    "ScriptRead",
    "ScriptRunResult",
    "ScriptUpdate",
    "BoxCreate",
    "BoxRead",
    "BoxUpdate",
    "NoteCreate",
    "NoteRead",
    "NoteUpdate",
    "EventCreate",
    "EventRead",
    "ItemCreate",
    "ItemRead",
    "ItemUpdate",
    "SearchResponse",
    "SearchResultItem",
    "SuggestionResponse",
    "SuggestionItem",
]
