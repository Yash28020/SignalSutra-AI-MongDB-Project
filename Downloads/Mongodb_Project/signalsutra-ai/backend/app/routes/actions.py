"""API routes for response actions."""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db
from app.schemas.actions import ActionCreate, ActionUpdate, ActionResponse
from app.services import action_service

router = APIRouter()


@router.post("", response_model=ActionResponse, status_code=201)
async def create_action(body: ActionCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await action_service.create_action(db, body.model_dump())
    return doc


@router.get("")
async def list_actions(
    incidentId: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    docs, total = await action_service.list_actions(
        db, incident_id=incidentId, status=status, priority=priority, skip=skip, limit=limit
    )
    return {"data": docs, "total": total, "skip": skip, "limit": limit}


@router.get("/{action_id}", response_model=ActionResponse)
async def get_action(action_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await action_service.get_action(db, action_id)
    if not doc:
        raise HTTPException(404, "Action not found")
    return doc


@router.patch("/{action_id}", response_model=ActionResponse)
async def update_action(action_id: str, body: ActionUpdate, db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await action_service.update_action(db, action_id, body.model_dump(exclude_unset=True))
    if not doc:
        raise HTTPException(404, "Action not found")
    return doc


@router.delete("/{action_id}", status_code=204)
async def delete_action(action_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    deleted = await action_service.delete_action(db, action_id)
    if not deleted:
        raise HTTPException(404, "Action not found")
