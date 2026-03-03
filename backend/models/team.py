from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from models.base import PyObjectId

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamInDB(TeamBase):
    id: PyObjectId = Field(default_factory=lambda: ObjectId(), alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class TeamResponse(TeamBase):
    id: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        id = data.get("_id")
        return cls(
            **{k: v for k, v in data.items() if k != "_id"},
            id=str(id) if id else ""
        )
