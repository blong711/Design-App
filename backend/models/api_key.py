from pydantic import BaseModel, Field
from datetime import datetime, timezone
from models.base import PyObjectId

class ApiKeyBase(BaseModel):
    system_name: str
    is_active: bool = True

class ApiKeyCreate(ApiKeyBase):
    pass

class ApiKeyInDB(ApiKeyBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    key: str # Hashed or generated token
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class ApiKeyResponse(ApiKeyBase):
    id: str
    created_at: datetime

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        id = data.get("_id")
        return cls(**data, id=str(id) if id else "")
