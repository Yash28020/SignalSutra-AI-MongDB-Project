"""Pydantic schemas for the risk_assessments collection."""
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


class RiskFactor(BaseModel):
    factor: str
    weight: float = Field(ge=0, le=1)
    score: float = Field(ge=0, le=10)
    description: Optional[str] = None


class AssessmentCreate(BaseModel):
    incidentId: str
    riskLevel: Literal["low", "moderate", "high", "critical"]
    overallScore: float = Field(ge=0, le=10)
    factors: List[RiskFactor] = []
    summary: str = Field(max_length=2000)
    recommendations: List[str] = []
    assessedBy: str = "system"


class AssessmentUpdate(BaseModel):
    riskLevel: Optional[Literal["low", "moderate", "high", "critical"]] = None
    overallScore: Optional[float] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None


class AssessmentResponse(BaseModel):
    id: str
    incidentId: str
    riskLevel: str
    overallScore: float
    factors: List[RiskFactor]
    summary: str
    recommendations: List[str]
    assessedBy: str
    assessedAt: datetime
    createdAt: datetime

    model_config = {"from_attributes": True}
