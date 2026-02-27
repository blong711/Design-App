from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from models.base import PyObjectId

class TicketBase(BaseModel):
    title: str
    description: str
    status: str = Field(default="pending", description="pending, assigned, in_progress, review, needs_revision, completed, canceled")
    price: Optional[float] = 0.0
    image_url: Optional[str] = None
    result_link: Optional[str] = None
    external_source: Optional[str] = None
    external_ref_id: Optional[str] = None
    payment_status: str = Field(default="unpaid", description="unpaid, paid")
    rejection_reason: Optional[str] = None
    due_date: Optional[datetime] = None

class TicketCreate(BaseModel):
    title: str
    description: str
    price: Optional[float] = 0.0
    image_url: Optional[str] = None

class TicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    price: Optional[float] = None
    result_link: Optional[str] = None
    payment_status: Optional[str] = None
    rejection_reason: Optional[str] = None
    due_date: Optional[datetime] = None

class TicketInDB(TicketBase):
    id: PyObjectId = Field(default_factory=lambda: ObjectId(), alias="_id")
    assigned_to: Optional[PyObjectId] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    is_deleted: bool = False

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class TicketResponse(TicketBase):
    id: str
    assigned_to: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    is_deleted: bool

    @classmethod
    def from_mongo(cls, data: dict):
        if not data:
            return data
        data_copy = {k: v for k, v in data.items() if k not in ["_id", "assigned_to"]}
        id = data.get("_id")
        assigned_to = data.get("assigned_to")
        return cls(
            **data_copy,
            id=str(id) if id else "",
            assigned_to=str(assigned_to) if assigned_to else None
        )
