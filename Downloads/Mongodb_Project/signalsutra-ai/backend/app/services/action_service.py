"""CRUD service for the response_actions collection."""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


def _doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


async def create_action(db: AsyncIOMotorDatabase, data: dict) -> dict:
    now = datetime.now(timezone.utc)
    data["createdAt"] = now
    data["updatedAt"] = now
    result = await db["response_actions"].insert_one(data)
    doc = await db["response_actions"].find_one({"_id": result.inserted_id})
    return _doc_to_response(doc)


async def get_action(db: AsyncIOMotorDatabase, action_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(action_id):
        return None
    doc = await db["response_actions"].find_one({"_id": ObjectId(action_id)})
    return _doc_to_response(doc) if doc else None


async def list_actions(
    db: AsyncIOMotorDatabase,
    *,
    incident_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[dict], int]:
    query: dict = {}
    if incident_id:
        query["incidentId"] = incident_id
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority

    total = await db["response_actions"].count_documents(query)
    cursor = db["response_actions"].find(query).sort("createdAt", -1).skip(skip).limit(limit)
    docs = [_doc_to_response(d) async for d in cursor]
    return docs, total


async def update_action(db: AsyncIOMotorDatabase, action_id: str, data: dict) -> Optional[dict]:
    if not ObjectId.is_valid(action_id):
        return None
    data = {k: v for k, v in data.items() if v is not None}
    if not data:
        return await get_action(db, action_id)
    data["updatedAt"] = datetime.now(timezone.utc)
    await db["response_actions"].update_one({"_id": ObjectId(action_id)}, {"$set": data})
    return await get_action(db, action_id)


async def delete_action(db: AsyncIOMotorDatabase, action_id: str) -> bool:
    if not ObjectId.is_valid(action_id):
        return False
    result = await db["response_actions"].delete_one({"_id": ObjectId(action_id)})
    return result.deleted_count == 1
