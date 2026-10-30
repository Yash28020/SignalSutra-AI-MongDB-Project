"""Pydantic schemas for the incidents collection."""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime
from app.schemas.signals import GeoPoint


class IncidentRegion(BaseModel):
    center: GeoPoint
    radiusKm: float = Field(ge=0.1, le=500)
    name: str


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(max_length=2000)
    incidentType: Literal[
        "flood", "earthquake", "landslide", "fire", "cyclone",
        "industrial", "infrastructure", "multi_hazard", "other"
    ]
    severity: Literal["low", "moderate", "high", "critical"]
    status: Literal["detected", "monitoring", "active", "contained", "resolved"] = "detected"
    region: IncidentRegion
    linkedSignalIds: List[str] = []
    simulation: bool = True


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Literal["low", "moderate", "high", "critical"]] = None
    status: Optional[Literal["detected", "monitoring", "active", "contained", "resolved"]] = None
    linkedSignalIds: Optional[List[str]] = None


class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    incidentType: str
    severity: str
    status: str
    region: IncidentRegion
    linkedSignalIds: List[str]
    simulation: bool
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}
