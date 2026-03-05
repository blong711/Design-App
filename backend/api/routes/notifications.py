from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from api.deps import get_db, get_current_admin, get_current_user
from models.user import UserResponse
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter()

class BroadcastMessage(BaseModel):
    message: str
    is_active: bool = True
    type: str = "info" # info, warning, danger

@router.get("")
async def get_broadcast(db=Depends(get_db)):
    """Get the latest active broadcast message."""
    msg = await db["broadcasts"].find_one({"is_active": True}, sort=[("created_at", -1)])
    if msg:
        msg["id"] = str(msg.pop("_id"))
        return msg
    return None

@router.post("")
async def create_broadcast(
    msg: BroadcastMessage,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    """Create a new broadcast message (Admin only)."""
    # Deactivate current messages
    await db["broadcasts"].update_many({"is_active": True}, {"$set": {"is_active": False}})
    
    new_msg = msg.dict()
    new_msg["created_at"] = datetime.now(timezone.utc)
    new_msg["created_by"] = str(current_user.id)
    
    result = await db["broadcasts"].insert_one(new_msg)
    new_msg["id"] = str(result.inserted_id)
    # Convert datetime to string or return without it if it causes issues
    if "created_at" in new_msg:
        new_msg["created_at"] = new_msg["created_at"].isoformat()
        
    return new_msg

@router.delete("")
async def delete_broadcast(
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    """Deactivate all broadcast messages (Admin only)."""
    await db["broadcasts"].update_many({"is_active": True}, {"$set": {"is_active": False}})
    return {"message": "Broadcast cleared"}
