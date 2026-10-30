"""MongoDB database connection and lifecycle management using Motor (async)."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, GEOSPHERE, TEXT
from pymongo.errors import ConnectionFailure, OperationFailure
from app.config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Initialize the MongoDB connection."""
    global _client, _db
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )
        # Verify connection
        await _client.admin.command("ping")
        _db = _client[settings.mongodb_database]
        logger.info(f"Connected to MongoDB: {settings.mongodb_database}")
        await setup_indexes()
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        # Allow app to start even without DB — health endpoint will report status
        _client = None
        _db = None


async def close_db() -> None:
    """Close the MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    """Return the database handle; raises if not connected."""
    if _db is None:
        raise RuntimeError("Database not connected. Check MONGODB_URI configuration.")
    return _db


async def is_db_connected() -> bool:
    """Return True if MongoDB is reachable."""
    if _client is None:
        return False
    try:
        await _client.admin.command("ping")
        return True
    except Exception:
        return False


async def setup_indexes() -> None:
    """Create all required indexes idempotently."""
    if _db is None:
        return
    try:
        # ── signals ─────────────────────────────────────────────────────────
        signals = _db["signals"]
        await signals.create_index([("location", GEOSPHERE)], name="signals_location_2dsphere")
        await signals.create_index([("signalType", ASCENDING), ("observedAt", DESCENDING)], name="signals_type_time")
        await signals.create_index([("verificationStatus", ASCENDING), ("observedAt", DESCENDING)], name="signals_verification_time")
        await signals.create_index([("source.sourceId", ASCENDING)], name="signals_source_id", sparse=True)
        await signals.create_index([("severity", ASCENDING)], name="signals_severity")
        await signals.create_index([("simulation", ASCENDING)], name="signals_simulation")

        # ── incidents ────────────────────────────────────────────────────────
        incidents = _db["incidents"]
        await incidents.create_index([("region.center", GEOSPHERE)], name="incidents_center_2dsphere")
        await incidents.create_index([("status", ASCENDING), ("updatedAt", DESCENDING)], name="incidents_status_time")
        await incidents.create_index([("severity", ASCENDING)], name="incidents_severity")

        # ── signal_links ─────────────────────────────────────────────────────
        links = _db["signal_links"]
        await links.create_index([("fromSignalId", ASCENDING), ("toId", ASCENDING)], name="links_from_to")
        await links.create_index([("toId", ASCENDING)], name="links_to")

        # ── risk_assessments ──────────────────────────────────────────────────
        assessments = _db["risk_assessments"]
        await assessments.create_index([("incidentId", ASCENDING), ("assessedAt", DESCENDING)], name="assessments_incident_time")
        await assessments.create_index([("riskLevel", ASCENDING)], name="assessments_risk_level")

        # ── infrastructure_assets ─────────────────────────────────────────────
        assets = _db["infrastructure_assets"]
        await assets.create_index([("location", GEOSPHERE)], name="assets_location_2dsphere")
        await assets.create_index([("assetType", ASCENDING)], name="assets_type")
        await assets.create_index([("availabilityStatus", ASCENDING)], name="assets_availability")

        # ── response_actions ──────────────────────────────────────────────────
        actions = _db["response_actions"]
        await actions.create_index([("status", ASCENDING), ("createdAt", DESCENDING)], name="actions_status_time")
        await actions.create_index([("incidentId", ASCENDING)], name="actions_incident")
        await actions.create_index([("priority", ASCENDING)], name="actions_priority")

        # ── audit_events ──────────────────────────────────────────────────────
        audit = _db["audit_events"]
        await audit.create_index([("entityId", ASCENDING), ("createdAt", DESCENDING)], name="audit_entity_time")
        await audit.create_index([("entityType", ASCENDING), ("createdAt", DESCENDING)], name="audit_type_time")
        await audit.create_index([("eventType", ASCENDING)], name="audit_event_type")

        logger.info("MongoDB indexes created/verified successfully.")
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
