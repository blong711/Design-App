from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from models.base import PyObjectId

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class CommentInDB(CommentBase):
    id: PyObjectId = Field(default_factory=lambda: ObjectId(), alias="_id")
    ticket_id: PyObjectId
    user_id: str
    user_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class CommentResponse(CommentBase):
    id: str
    ticket_id: str
    user_id: str
    user_name: str
    created_at: datetime

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        id = data.get("_id")
        ticket_id = data.get("ticket_id")
        return cls(
            content=data.get("content"),
            id=str(id) if id else "",
            ticket_id=str(ticket_id) if ticket_id else "",
            user_id=data.get("user_id"),
            user_name=data.get("user_name"),
            created_at=data.get("created_at")
        )
