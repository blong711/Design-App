from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from models.base import PyObjectId

class StatusHistoryInDB(BaseModel):
    id: PyObjectId = Field(default_factory=lambda: ObjectId(), alias="_id")
    design_id: str
    old_status: Optional[str] = None
    new_status: str
    changed_by: str  # user_id
    changed_by_name: str  # user full name
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class StatusHistoryResponse(BaseModel):
    id: str
    design_id: str
    old_status: Optional[str] = None
    new_status: str
    changed_by: str
    changed_by_name: str
    created_at: datetime
    type: str = "status_change"  # To differentiate from comments in frontend

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        data_copy = {k: v for k, v in data.items() if k not in ["_id"]}
        id = data.get("_id")
        return cls(
            **data_copy,
            id=str(id) if id else ""
        )
