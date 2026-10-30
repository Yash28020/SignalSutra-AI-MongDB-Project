"""Pydantic schemas for dashboard aggregation responses."""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class CountBySeverity(BaseModel):
    severity: str
    count: int


class CountByType(BaseModel):
    type: str
    count: int


class CountByStatus(BaseModel):
    status: str
    count: int


class TimeSeriesPoint(BaseModel):
    date: str
    count: int


class DashboardStats(BaseModel):
    totalSignals: int
    totalIncidents: int
    activeIncidents: int
    totalAssets: int
    operationalAssets: int
    pendingActions: int
    signalsBySeverity: List[CountBySeverity]
    signalsByType: List[CountByType]
    incidentsByStatus: List[CountByStatus]
    signalTimeline: List[TimeSeriesPoint]
    recentSignals: List[dict]
    recentIncidents: List[dict]
    criticalAlerts: int
    avgRiskScore: Optional[float] = None
