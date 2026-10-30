"""Pydantic schemas for the signals collection."""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List, Any
from datetime import datetime
from enum import Enum


class GeoPoint(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: List[float]  # [longitude, latitude]

    @field_validator("coordinates")
    @classmethod
    def validate_coords(cls, v):
        if len(v) != 2:
            raise ValueError("coordinates must have exactly 2 elements [lon, lat]")
        lon, lat = v
        if not (-180 <= lon <= 180):
            raise ValueError(f"Longitude {lon} out of range [-180, 180]")
        if not (-90 <= lat <= 90):
            raise ValueError(f"Latitude {lat} out of range [-90, 90]")
        return v


class SignalSource(BaseModel):
    type: Literal["sensor", "citizen", "satellite", "model", "manual"] = "manual"
    name: str
    sourceId: Optional[str] = None


class Observation(BaseModel):
    value: float
    unit: str
    description: Optional[str] = None


class SignalCreate(BaseModel):
    signalType: Literal["rainfall", "flood", "earthquake", "landslide", "fire", "wind", "temperature", "river_level", "infrastructure_damage", "power_outage", "road_block", "chemical", "other"]
    source: SignalSource
    location: GeoPoint
    observedAt: datetime
    verificationStatus: Literal["verified", "unverified", "pending", "rejected"] = "pending"
    observation: Observation
    severity: Literal["low", "moderate", "high", "critical"]
    tags: List[str] = []
    simulation: bool = True


class SignalUpdate(BaseModel):
    verificationStatus: Optional[Literal["verified", "unverified", "pending", "rejected"]] = None
    severity: Optional[Literal["low", "moderate", "high", "critical"]] = None
    tags: Optional[List[str]] = None
    observation: Optional[Observation] = None


class SignalResponse(BaseModel):
    id: str
    signalType: str
    source: SignalSource
    location: GeoPoint
    observedAt: datetime
    verificationStatus: str
    observation: Observation
    severity: str
    tags: List[str]
    simulation: bool
    createdAt: datetime
    updatedAt: datetime

    model_config = {"from_attributes": True}
