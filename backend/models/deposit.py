from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from models.base import PyObjectId

class DepositRequestBase(BaseModel):
    amount: float
    status: str = Field(default="pending", description="pending, approved, rejected")
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

class DepositRequestCreate(BaseModel):
    amount: float
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None

class DepositRequestUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class DepositRequestInDB(DepositRequestBase):
    id: PyObjectId = Field(default_factory=lambda: ObjectId(), alias="_id")
    user_id: str
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class DepositRequestResponse(DepositRequestBase):
    id: str
    user_id: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

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
