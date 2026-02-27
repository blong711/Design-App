from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel, HttpUrl
from bson import ObjectId
from api.deps import get_db, get_current_user
from models.user import UserResponse
from datetime import datetime, timezone

router = APIRouter()

class WebhookCreate(BaseModel):
    url: str
    description: Optional[str] = ""
    events: Optional[List[str]] = ["ticket.created", "ticket.updated", "ticket.completed"]

class WebhookResponse(BaseModel):
    id: str
    url: str
    description: str
    events: List[str]
    is_active: bool
    created_at: str

@router.get("/", response_model=List[WebhookResponse])
async def list_webhooks(db=Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    items = await db["webhooks"].find({"user_id": current_user.id}).to_list(length=50)
    return [
        WebhookResponse(
            id=str(w["_id"]),
            url=w["url"],
            description=w.get("description", ""),
            events=w.get("events", []),
            is_active=w.get("is_active", True),
            created_at=w.get("created_at", "").isoformat() if hasattr(w.get("created_at", ""), "isoformat") else str(w.get("created_at", "")),
        )
        for w in items
    ]

@router.post("/", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    webhook_in: WebhookCreate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    # Check duplicate URL for this user
    existing = await db["webhooks"].find_one({"user_id": current_user.id, "url": webhook_in.url})
    if existing:
        raise HTTPException(status_code=400, detail="Webhook URL already exists")

    doc = {
        "user_id": current_user.id,
        "url": webhook_in.url,
        "description": webhook_in.description or "",
        "events": webhook_in.events,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db["webhooks"].insert_one(doc)
    created = await db["webhooks"].find_one({"_id": result.inserted_id})
    return WebhookResponse(
        id=str(created["_id"]),
        url=created["url"],
        description=created.get("description", ""),
        events=created.get("events", []),
        is_active=created.get("is_active", True),
        created_at=str(created.get("created_at", "")),
    )

@router.patch("/{webhook_id}/toggle")
async def toggle_webhook(
    webhook_id: str,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    wh = await db["webhooks"].find_one({"_id": ObjectId(webhook_id), "user_id": current_user.id})
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    new_status = not wh.get("is_active", True)
    await db["webhooks"].update_one({"_id": ObjectId(webhook_id)}, {"$set": {"is_active": new_status}})
    return {"is_active": new_status}

@router.delete("/{webhook_id}")
async def delete_webhook(
    webhook_id: str,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    wh = await db["webhooks"].find_one({"_id": ObjectId(webhook_id), "user_id": current_user.id})
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    await db["webhooks"].delete_one({"_id": ObjectId(webhook_id)})
    return {"message": "Webhook deleted"}
