from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
from models.base import PyObjectId
from bson import ObjectId

class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = Field(default="designer", description="admin, manager, or designer")
    team_id: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    avatar_url: Optional[str] = None
    team_id: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=lambda: ObjectId(), alias="_id")
    hashed_password: str
    avatar_url: Optional[str] = None
    team_id: Optional[PyObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class UserResponse(UserBase):
    id: str
    avatar_url: Optional[str] = None
    team_id: Optional[str] = None

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        data_copy = {k: v for k, v in data.items() if k not in ["_id", "team_id"]}
        id = data.get("_id")
        team_id = data.get("team_id")
        return cls(
            **data_copy, 
            id=str(id) if id else "",
            team_id=str(team_id) if team_id else None
        )
