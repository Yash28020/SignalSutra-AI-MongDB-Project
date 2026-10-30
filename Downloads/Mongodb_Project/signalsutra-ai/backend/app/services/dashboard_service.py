"""Dashboard aggregation service — pulls stats across all collections."""
import logging
from datetime import datetime, timedelta, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


def _id_to_str(doc: dict) -> dict:
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


async def get_dashboard_stats(db: AsyncIOMotorDatabase) -> dict:
    """Return aggregated statistics for the command-center dashboard."""
    # ── counts ──────────────────────────────────────────────────────────
    total_signals = await db["signals"].count_documents({})
    total_incidents = await db["incidents"].count_documents({})
    active_incidents = await db["incidents"].count_documents(
        {"status": {"$in": ["detected", "monitoring", "active"]}}
    )
    total_assets = await db["infrastructure_assets"].count_documents({})
    operational_assets = await db["infrastructure_assets"].count_documents(
        {"availabilityStatus": "operational"}
    )
    pending_actions = await db["response_actions"].count_documents(
        {"status": {"$in": ["planned", "in_progress"]}}
    )
    critical_alerts = await db["signals"].count_documents({"severity": "critical"})

    # ── signals by severity ─────────────────────────────────────────────
    severity_pipeline = [
        {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    severity_cursor = db["signals"].aggregate(severity_pipeline)
    signals_by_severity = [
        {"severity": d["_id"], "count": d["count"]} async for d in severity_cursor
    ]

    # ── signals by type ─────────────────────────────────────────────────
    type_pipeline = [
        {"$group": {"_id": "$signalType", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    type_cursor = db["signals"].aggregate(type_pipeline)
    signals_by_type = [
        {"type": d["_id"], "count": d["count"]} async for d in type_cursor
    ]

    # ── incidents by status ─────────────────────────────────────────────
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    status_cursor = db["incidents"].aggregate(status_pipeline)
    incidents_by_status = [
        {"status": d["_id"], "count": d["count"]} async for d in status_cursor
    ]

    # ── signal timeline (last 30 days) ──────────────────────────────────
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    timeline_pipeline = [
        {"$match": {"observedAt": {"$gte": thirty_days_ago}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$observedAt"}},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    timeline_cursor = db["signals"].aggregate(timeline_pipeline)
    signal_timeline = [
        {"date": d["_id"], "count": d["count"]} async for d in timeline_cursor
    ]

    # ── recent signals (last 10) ────────────────────────────────────────
    recent_signals_cursor = db["signals"].find().sort("observedAt", -1).limit(10)
    recent_signals = [_id_to_str(d) async for d in recent_signals_cursor]

    # ── recent incidents (last 5) ───────────────────────────────────────
    recent_incidents_cursor = db["incidents"].find().sort("updatedAt", -1).limit(5)
    recent_incidents = [_id_to_str(d) async for d in recent_incidents_cursor]

    # ── average risk score ──────────────────────────────────────────────
    avg_pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$overallScore"}}}]
    avg_cursor = db["risk_assessments"].aggregate(avg_pipeline)
    avg_doc = await avg_cursor.to_list(1)
    avg_risk_score = round(avg_doc[0]["avg"], 2) if avg_doc else None

    return {
        "totalSignals": total_signals,
        "totalIncidents": total_incidents,
        "activeIncidents": active_incidents,
        "totalAssets": total_assets,
        "operationalAssets": operational_assets,
        "pendingActions": pending_actions,
        "signalsBySeverity": signals_by_severity,
        "signalsByType": signals_by_type,
        "incidentsByStatus": incidents_by_status,
        "signalTimeline": signal_timeline,
        "recentSignals": recent_signals,
        "recentIncidents": recent_incidents,
        "criticalAlerts": critical_alerts,
        "avgRiskScore": avg_risk_score,
    }
