"""API routes for risk assessments."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db
from app.schemas.assessments import AssessmentCreate, AssessmentResponse
from app.services import assessment_service

router = APIRouter()


@router.post("", response_model=AssessmentResponse, status_code=201)
async def create_assessment(body: AssessmentCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await assessment_service.create_assessment(db, body.model_dump())
    return doc


@router.get("")
async def list_assessments(
    incidentId: Optional[str] = None,
    riskLevel: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs, total = await assessment_service.list_assessments(
        db, incident_id=incidentId, risk_level=riskLevel, skip=skip, limit=limit
    )
    return {"data": docs, "total": total, "skip": skip, "limit": limit}


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(assessment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await assessment_service.get_assessment(db, assessment_id)
    if not doc:
        raise HTTPException(404, "Assessment not found")
    return doc


@router.delete("/{assessment_id}", status_code=204)
async def delete_assessment(assessment_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    deleted = await assessment_service.delete_assessment(db, assessment_id)
    if not deleted:
        raise HTTPException(404, "Assessment not found")
