"""API routes for incidents."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db
from app.schemas.incidents import IncidentCreate, IncidentUpdate, IncidentResponse
from app.services import incident_service

router = APIRouter()


@router.post("", response_model=IncidentResponse, status_code=201)
async def create_incident(body: IncidentCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await incident_service.create_incident(db, body.model_dump())
    return doc


@router.get("")
async def list_incidents(
    incidentType: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs, total = await incident_service.list_incidents(
        db, incident_type=incidentType, severity=severity, status=status, skip=skip, limit=limit
    )
    return {"data": docs, "total": total, "skip": skip, "limit": limit}


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(incident_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await incident_service.get_incident(db, incident_id)
    if not doc:
        raise HTTPException(404, "Incident not found")
    return doc


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(incident_id: str, body: IncidentUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await incident_service.update_incident(db, incident_id, body.model_dump(exclude_unset=True))
    if not doc:
        raise HTTPException(404, "Incident not found")
    return doc


@router.delete("/{incident_id}", status_code=204)
async def delete_incident(incident_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    deleted = await incident_service.delete_incident(db, incident_id)
    if not deleted:
        raise HTTPException(404, "Incident not found")
