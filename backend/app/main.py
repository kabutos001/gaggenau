import logging
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging *before* the router imports so our module loggers (e.g. the
# assistant router) emit to stdout — uvicorn sets up its own handlers but not
# the app's loggers. Matches the batch25 reference's pattern.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

from .config import settings  # noqa: E402
from .errors import register_exception_handlers  # noqa: E402
from .routers.assistant import router as assistant_router  # noqa: E402
from .routers.team_members import router as team_members_router  # noqa: E402

# Import our routers here
# from .routers.example import router as example_router


app = FastAPI(
    title="DPS Template API",
    description="FastAPI backend with PostgreSQL, Supabase, and Claude",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
register_exception_handlers(app)


@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Welcome to DPS Template API"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "timestamp": datetime.now(tz=timezone.utc).isoformat().replace("+00:00", "Z"),
    }


# Include our routers here
# app.include_router(example_router)
app.include_router(team_members_router)
app.include_router(assistant_router)
