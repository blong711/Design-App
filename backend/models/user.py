from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from models.base import PyObjectId
from bson import ObjectId

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = Field(default="designer", description="admin or designer")
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserResponse(UserBase):
    id: str

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        id = data.get("_id")
        return cls(**data, id=str(id) if id else "")
