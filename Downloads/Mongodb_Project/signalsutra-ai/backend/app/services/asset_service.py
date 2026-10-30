"""CRUD service for the infrastructure_assets collection."""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


def _doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


async def create_asset(db: AsyncIOMotorDatabase, data: dict) -> dict:
    now = datetime.now(timezone.utc)
    data["createdAt"] = now
    data["updatedAt"] = now
    result = await db["infrastructure_assets"].insert_one(data)
    doc = await db["infrastructure_assets"].find_one({"_id": result.inserted_id})
    return _doc_to_response(doc)


async def get_asset(db: AsyncIOMotorDatabase, asset_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(asset_id):
        return None
    doc = await db["infrastructure_assets"].find_one({"_id": ObjectId(asset_id)})
    return _doc_to_response(doc) if doc else None


async def list_assets(
    db: AsyncIOMotorDatabase,
    *,
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[dict], int]:
    query: dict = {}
    if asset_type:
        query["assetType"] = asset_type
    if status:
        query["availabilityStatus"] = status

    total = await db["infrastructure_assets"].count_documents(query)
    cursor = db["infrastructure_assets"].find(query).sort("createdAt", -1).skip(skip).limit(limit)
    docs = [_doc_to_response(d) async for d in cursor]
    return docs, total


async def update_asset(db: AsyncIOMotorDatabase, asset_id: str, data: dict) -> Optional[dict]:
    if not ObjectId.is_valid(asset_id):
        return None
    data = {k: v for k, v in data.items() if v is not None}
    if not data:
        return await get_asset(db, asset_id)
    data["updatedAt"] = datetime.now(timezone.utc)
    await db["infrastructure_assets"].update_one({"_id": ObjectId(asset_id)}, {"$set": data})
    return await get_asset(db, asset_id)


async def delete_asset(db: AsyncIOMotorDatabase, asset_id: str) -> bool:
    if not ObjectId.is_valid(asset_id):
        return False
    result = await db["infrastructure_assets"].delete_one({"_id": ObjectId(asset_id)})
    return result.deleted_count == 1


async def nearby_assets(
    db: AsyncIOMotorDatabase,
    longitude: float,
    latitude: float,
    radius_km: float = 50,
    limit: int = 20,
) -> List[dict]:
    cursor = db["infrastructure_assets"].find({
        "location": {
            "$nearSphere": {
                "$geometry": {"type": "Point", "coordinates": [longitude, latitude]},
                "$maxDistance": radius_km * 1000,
            }
        }
    }).limit(limit)
    return [_doc_to_response(d) async for d in cursor]
