"""API routes for infrastructure assets."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db
from app.schemas.assets import AssetCreate, AssetUpdate, AssetResponse
from app.services import asset_service

router = APIRouter()


@router.post("", response_model=AssetResponse, status_code=201)
async def create_asset(body: AssetCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await asset_service.create_asset(db, body.model_dump())
    return doc


@router.get("")
async def list_assets(
    assetType: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs, total = await asset_service.list_assets(
        db, asset_type=assetType, status=status, skip=skip, limit=limit
    )
    return {"data": docs, "total": total, "skip": skip, "limit": limit}


@router.get("/nearby")
async def nearby_assets(
    longitude: float = Query(...),
    latitude: float = Query(...),
    radiusKm: float = Query(50, ge=1, le=500),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await asset_service.nearby_assets(db, longitude, latitude, radiusKm, limit)
    return {"data": docs}


@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await asset_service.get_asset(db, asset_id)
    if not doc:
        raise HTTPException(404, "Asset not found")
    return doc


@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, body: AssetUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await asset_service.update_asset(db, asset_id, body.model_dump(exclude_unset=True))
    if not doc:
        raise HTTPException(404, "Asset not found")
    return doc


@router.delete("/{asset_id}", status_code=204)
async def delete_asset(asset_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    deleted = await asset_service.delete_asset(db, asset_id)
    if not deleted:
        raise HTTPException(404, "Asset not found")
