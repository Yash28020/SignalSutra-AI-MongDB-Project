"""Dashboard endpoint — aggregated statistics."""
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db
from app.services import dashboard_service

router = APIRouter()


@router.get("")
async def get_dashboard(db: AsyncIOMotorDatabase = Depends(get_db)):
    stats = await dashboard_service.get_dashboard_stats(db)
    return stats
