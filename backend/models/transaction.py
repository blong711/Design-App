from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from models.base import PyObjectId

class TransactionBase(BaseModel):
    user_id: str
    amount: float
    type: str = Field(description="deposit, design_payment, refund, withdrawal")
    reference_id: Optional[str] = None
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionInDB(TransactionBase):
    id: PyObjectId = Field(default_factory=lambda: ObjectId(), alias="_id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class TransactionResponse(TransactionBase):
    id: str
    created_at: datetime
    user_full_name: Optional[str] = None
    user_email: Optional[str] = None

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
