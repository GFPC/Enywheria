from app.routers.items import router as items_router
from app.routers.tags import router as tags_router
from app.routers.collections import router as collections_router
from app.routers.projects import router as projects_router
from app.routers.clients import router as clients_router
from app.routers.devices import router as devices_router
from app.routers.scripts import router as scripts_router
from app.routers.boxes import router as boxes_router
from app.routers.notes import router as notes_router
from app.routers.events import router as events_router
from app.routers.search import router as search_router
from app.routers.files import router as files_router
from app.routers.health import router as health_router
from app.routers.ui import router as ui_router

__all__ = [
    "items_router",
    "tags_router",
    "collections_router",
    "projects_router",
    "clients_router",
    "devices_router",
    "scripts_router",
    "boxes_router",
    "notes_router",
    "events_router",
    "search_router",
    "files_router",
    "health_router",
    "ui_router",
]
