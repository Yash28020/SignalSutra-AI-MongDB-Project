"""Pydantic schemas for the infrastructure_assets collection."""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime
from app.schemas.signals import GeoPoint


class AssetCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    assetType: Literal[
        "hospital", "fire_station", "police_station", "shelter",
        "bridge", "dam", "power_plant", "water_treatment",
        "communication_tower", "warehouse", "helipad", "other"
    ]
    location: GeoPoint
    capacity: Optional[int] = None
    availabilityStatus: Literal["operational", "partial", "offline", "destroyed"] = "operational"
    contactInfo: Optional[str] = None
    tags: List[str] = []


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    availabilityStatus: Optional[Literal["operational", "partial", "offline", "destroyed"]] = None
    capacity: Optional[int] = None
    contactInfo: Optional[str] = None
    tags: Optional[List[str]] = None


class AssetResponse(BaseModel):
    id: str
    name: str
    assetType: str
    location: GeoPoint
    capacity: Optional[int]
    availabilityStatus: str
    contactInfo: Optional[str]
    tags: List[str]
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}
