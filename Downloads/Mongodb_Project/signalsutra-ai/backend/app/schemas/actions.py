"""Pydantic schemas for the response_actions collection."""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


class ActionCreate(BaseModel):
    incidentId: str
    title: str = Field(min_length=3, max_length=300)
    description: str = Field(max_length=2000)
    actionType: Literal[
        "evacuate", "deploy_team", "distribute_supplies",
        "medical_response", "infrastructure_repair",
        "communication", "search_rescue", "other"
    ]
    priority: Literal["low", "medium", "high", "critical"] = "medium"
    status: Literal["planned", "in_progress", "completed", "cancelled"] = "planned"
    assignedTo: Optional[str] = None
    estimatedDurationMinutes: Optional[int] = None
    linkedAssetIds: List[str] = []


class ActionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high", "critical"]] = None
    status: Optional[Literal["planned", "in_progress", "completed", "cancelled"]] = None
    assignedTo: Optional[str] = None
    estimatedDurationMinutes: Optional[int] = None
    linkedAssetIds: Optional[List[str]] = None


class ActionResponse(BaseModel):
    id: str
    incidentId: str
    title: str
    description: str
    actionType: str
    priority: str
    status: str
    assignedTo: Optional[str]
    estimatedDurationMinutes: Optional[int]
    linkedAssetIds: List[str]
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}
