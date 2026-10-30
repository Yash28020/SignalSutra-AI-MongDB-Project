"""CRUD service for the risk_assessments collection."""
import logging
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


def _doc_to_response(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


async def create_assessment(db: AsyncIOMotorDatabase, data: dict) -> dict:
    now = datetime.now(timezone.utc)
    data["assessedAt"] = now
    data["createdAt"] = now
    result = await db["risk_assessments"].insert_one(data)
    doc = await db["risk_assessments"].find_one({"_id": result.inserted_id})
    return _doc_to_response(doc)


async def get_assessment(db: AsyncIOMotorDatabase, assessment_id: str) -> Optional[dict]:
    if not ObjectId.is_valid(assessment_id):
        return None
    doc = await db["risk_assessments"].find_one({"_id": ObjectId(assessment_id)})
    return _doc_to_response(doc) if doc else None


async def list_assessments(
    db: AsyncIOMotorDatabase,
    *,
    incident_id: Optional[str] = None,
    risk_level: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[dict], int]:
    query: dict = {}
    if incident_id:
        query["incidentId"] = incident_id
    if risk_level:
        query["riskLevel"] = risk_level

    total = await db["risk_assessments"].count_documents(query)
    cursor = db["risk_assessments"].find(query).sort("assessedAt", -1).skip(skip).limit(limit)
    docs = [_doc_to_response(d) async for d in cursor]
    return docs, total


async def delete_assessment(db: AsyncIOMotorDatabase, assessment_id: str) -> bool:
    if not ObjectId.is_valid(assessment_id):
        return False
    result = await db["risk_assessments"].delete_one({"_id": ObjectId(assessment_id)})
    return result.deleted_count == 1
