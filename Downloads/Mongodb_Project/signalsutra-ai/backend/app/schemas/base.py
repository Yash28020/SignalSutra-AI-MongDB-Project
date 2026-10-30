"""Shared Pydantic utilities for ObjectId serialization."""
from pydantic import BaseModel, field_validator, model_serializer
from bson import ObjectId
from datetime import datetime
from typing import Any


def objectid_to_str(oid: Any) -> str:
    return str(oid) if oid else None


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if isinstance(v, ObjectId):
            return str(v)
        if ObjectId.is_valid(v):
            return str(v)
        raise ValueError(f"Invalid ObjectId: {v}")

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.to_string_ser_schema(),
        )
