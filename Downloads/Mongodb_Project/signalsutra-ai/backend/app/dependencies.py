"""FastAPI dependency injectors."""
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_db as _get_db


def get_db() -> AsyncIOMotorDatabase:
    """Inject the database handle or raise 503."""
    try:
        return _get_db()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
