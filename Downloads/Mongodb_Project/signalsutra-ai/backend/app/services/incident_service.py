"""CRUD service for the incidents collection."""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


def _doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


async def create_incident(db: AsyncIOMotorDatabase, data: dict) -> dict:
    now = datetime.now(timezone.utc)
    data["createdAt"] = now
    data["updatedAt"] = now
    result = await db["incidents"].insert_one(data)
    doc = await db["incidents"].find_one({"_id": result.inserted_id})
    return _doc_to_response(doc)


async def get_incident(db: AsyncIOMotorDatabase, incident_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(incident_id):
        return None
    doc = await db["incidents"].find_one({"_id": ObjectId(incident_id)})
    return _doc_to_response(doc) if doc else None


async def list_incidents(
    db: AsyncIOMotorDatabase,
    *,
    incident_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[dict], int]:
    query: dict = {}
    if incident_type:
        query["incidentType"] = incident_type
    if severity:
        query["severity"] = severity
    if status:
        query["status"] = status

    total = await db["incidents"].count_documents(query)
    cursor = db["incidents"].find(query).sort("updatedAt", -1).skip(skip).limit(limit)
    docs = [_doc_to_response(d) async for d in cursor]
    return docs, total


async def update_incident(db: AsyncIOMotorDatabase, incident_id: str, data: dict) -> Optional[dict]:
    if not ObjectId.is_valid(incident_id):
        return None
    data = {k: v for k, v in data.items() if v is not None}
    if not data:
        return await get_incident(db, incident_id)
    data["updatedAt"] = datetime.now(timezone.utc)
    await db["incidents"].update_one({"_id": ObjectId(incident_id)}, {"$set": data})
    return await get_incident(db, incident_id)


async def delete_incident(db: AsyncIOMotorDatabase, incident_id: str) -> bool:
    if not ObjectId.is_valid(incident_id):
        return False
    result = await db["incidents"].delete_one({"_id": ObjectId(incident_id)})
    return result.deleted_count == 1
