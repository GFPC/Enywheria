from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import settings
from app.utils.logging import setup_logging, logger
from app.routers import (
    items_router,
    tags_router,
    collections_router,
    projects_router,
    clients_router,
    devices_router,
    scripts_router,
    boxes_router,
    notes_router,
    events_router,
    search_router,
    files_router,
    health_router,
    ui_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} service...")
    yield
    logger.info(f"Shutting down {settings.APP_NAME} service...")


app = FastAPI(
    title=settings.APP_NAME,
    description="Personal Knowledge & Asset System (PersonalVault)",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Standardized Error Handling
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": f"HTTP_{exc.status_code}", "message": str(exc.detail)}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": {"code": "VALIDATION_ERROR", "message": exc.errors()}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected server error occurred."}},
    )


# Register API v1 Routers
api_v1_prefix = "/api/v1"
app.include_router(items_router, prefix=api_v1_prefix)
app.include_router(tags_router, prefix=api_v1_prefix)
app.include_router(collections_router, prefix=api_v1_prefix)
app.include_router(projects_router, prefix=api_v1_prefix)
app.include_router(clients_router, prefix=api_v1_prefix)
app.include_router(devices_router, prefix=api_v1_prefix)
app.include_router(scripts_router, prefix=api_v1_prefix)
app.include_router(boxes_router, prefix=api_v1_prefix)
app.include_router(notes_router, prefix=api_v1_prefix)
app.include_router(events_router, prefix=api_v1_prefix)
app.include_router(search_router, prefix=api_v1_prefix)
app.include_router(files_router, prefix=api_v1_prefix)
app.include_router(health_router, prefix=api_v1_prefix)

# Register Web UI Router
app.include_router(ui_router)
