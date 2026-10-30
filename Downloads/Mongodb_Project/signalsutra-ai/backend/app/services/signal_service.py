"""CRUD service for the signals collection."""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


def _doc_to_response(doc: dict) -> dict:
    """Normalise a MongoDB document for the API response."""
    doc["id"] = str(doc.pop("_id"))
    return doc


async def create_signal(db: AsyncIOMotorDatabase, data: dict) -> dict:
    now = datetime.now(timezone.utc)
    data["createdAt"] = now
    data["updatedAt"] = now
    result = await db["signals"].insert_one(data)
    doc = await db["signals"].find_one({"_id": result.inserted_id})
    return _doc_to_response(doc)


async def get_signal(db: AsyncIOMotorDatabase, signal_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(signal_id):
        return None
    doc = await db["signals"].find_one({"_id": ObjectId(signal_id)})
    return _doc_to_response(doc) if doc else None


async def list_signals(
    db: AsyncIOMotorDatabase,
    *,
    signal_type: Optional[str] = None,
    severity: Optional[str] = None,
    verification: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[dict], int]:
    query: dict = {}
    if signal_type:
        query["signalType"] = signal_type
    if severity:
        query["severity"] = severity
    if verification:
        query["verificationStatus"] = verification

    total = await db["signals"].count_documents(query)
    cursor = db["signals"].find(query).sort("observedAt", -1).skip(skip).limit(limit)
    docs = [_doc_to_response(d) async for d in cursor]
    return docs, total


async def update_signal(db: AsyncIOMotorDatabase, signal_id: str, data: dict) -> Optional[dict]:
    if not ObjectId.is_valid(signal_id):
        return None
    data = {k: v for k, v in data.items() if v is not None}
    if not data:
        return await get_signal(db, signal_id)
    data["updatedAt"] = datetime.now(timezone.utc)
    await db["signals"].update_one({"_id": ObjectId(signal_id)}, {"$set": data})
    return await get_signal(db, signal_id)


async def delete_signal(db: AsyncIOMotorDatabase, signal_id: str) -> bool:
    if not ObjectId.is_valid(signal_id):
        return False
    result = await db["signals"].delete_one({"_id": ObjectId(signal_id)})
    return result.deleted_count == 1


async def nearby_signals(
    db: AsyncIOMotorDatabase,
    longitude: float,
    latitude: float,
    radius_km: float = 50,
    limit: int = 20,
) -> List[dict]:
    """Geo-query for signals near a point."""
    cursor = db["signals"].find({
        "location": {
            "$nearSphere": {
                "$geometry": {"type": "Point", "coordinates": [longitude, latitude]},
                "$maxDistance": radius_km * 1000,
            }
        }
    }).limit(limit)
    return [_doc_to_response(d) async for d in cursor]
