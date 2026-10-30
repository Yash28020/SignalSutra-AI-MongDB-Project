"""SignalSutra AI — FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_db, close_db, is_db_connected
from app.routes.signals import router as signals_router
from app.routes.incidents import router as incidents_router
from app.routes.assets import router as assets_router
from app.routes.actions import router as actions_router
from app.routes.assessments import router as assessments_router
from app.routes.dashboard import router as dashboard_router
from app.routes.seed import router as seed_router

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Starting SignalSutra AI …")
    await connect_db()
    yield
    logger.info("Shutting down SignalSutra AI …")
    await close_db()


app = FastAPI(
    title="SignalSutra AI",
    description="Real-time disaster signal monitoring & command center",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──────────────────────────────────────────────────────────────────
app.include_router(signals_router, prefix="/api/signals", tags=["Signals"])
app.include_router(incidents_router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(assets_router, prefix="/api/assets", tags=["Infrastructure Assets"])
app.include_router(actions_router, prefix="/api/actions", tags=["Response Actions"])
app.include_router(assessments_router, prefix="/api/assessments", tags=["Risk Assessments"])
app.include_router(dashboard_router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(seed_router, prefix="/api/seed", tags=["Seed Data"])


@app.get("/api/health", tags=["Health"])
async def health_check():
    db_ok = await is_db_connected()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "version": app.version,
    }
