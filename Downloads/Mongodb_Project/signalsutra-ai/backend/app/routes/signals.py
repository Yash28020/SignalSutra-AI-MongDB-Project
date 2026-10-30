"""API routes for signals."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db
from app.schemas.signals import SignalCreate, SignalUpdate, SignalResponse
from app.services import signal_service

router = APIRouter()


@router.post("", response_model=SignalResponse, status_code=201)
async def create_signal(body: SignalCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await signal_service.create_signal(db, body.model_dump())
    return doc


@router.get("")
async def list_signals(
    signalType: Optional[str] = None,
    severity: Optional[str] = None,
    verificationStatus: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs, total = await signal_service.list_signals(
        db,
        signal_type=signalType,
        severity=severity,
        verification=verificationStatus,
        skip=skip,
        limit=limit,
    )
    return {"data": docs, "total": total, "skip": skip, "limit": limit}


@router.get("/nearby")
async def nearby_signals(
    longitude: float = Query(...),
    latitude: float = Query(...),
    radiusKm: float = Query(50, ge=1, le=500),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs = await signal_service.nearby_signals(db, longitude, latitude, radiusKm, limit)
    return {"data": docs}


@router.get("/{signal_id}", response_model=SignalResponse)
async def get_signal(signal_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await signal_service.get_signal(db, signal_id)
    if not doc:
        raise HTTPException(404, "Signal not found")
    return doc


@router.patch("/{signal_id}", response_model=SignalResponse)
async def update_signal(signal_id: str, body: SignalUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await signal_service.update_signal(db, signal_id, body.model_dump(exclude_unset=True))
    if not doc:
        raise HTTPException(404, "Signal not found")
    return doc


@router.delete("/{signal_id}", status_code=204)
async def delete_signal(signal_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    deleted = await signal_service.delete_signal(db, signal_id)
    if not deleted:
        raise HTTPException(404, "Signal not found")
