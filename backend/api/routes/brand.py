from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from api.deps import get_db, get_current_user, get_current_admin
from models.brand import BrandKitCreate, BrandKitUpdate, BrandKitInDB
from models.user import UserResponse
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()

@router.get("", response_model=Optional[dict])
async def get_brand_kit(
    user_id: Optional[str] = None,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get a brand kit by user_id (if admin/designer) or own brand kit."""
    target_id = user_id or str(current_user.id)
    
    if user_id and current_user.role not in ["admin", "designer"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    kit = await db["brand_kits"].find_one({"user_id": ObjectId(target_id)})
    if kit:
        kit["id"] = str(kit.pop("_id"))
        kit["user_id"] = str(kit["user_id"])
        return kit
    return None

@router.put("", response_model=dict)
async def update_brand_kit(
    new_kit: BrandKitUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Upsert the brand kit for the current user."""
    if current_user.role not in ["customer", "admin"]:
        raise HTTPException(status_code=403, detail="Only customers or admins can have a brand kit")

    data = new_kit.dict()
    data["user_id"] = ObjectId(current_user.id)
    data["updated_at"] = datetime.now(timezone.utc)
    
    # Use replace_one with upsert=True to handle deletions of items within lists
    await db["brand_kits"].replace_one(
        {"user_id": ObjectId(current_user.id)},
        data,
        upsert=True
    )
    
    # Fetch it back to return the complete object
    res = await db["brand_kits"].find_one({"user_id": ObjectId(current_user.id)})
    
    res["id"] = str(res.pop("_id"))
    res["user_id"] = str(res["user_id"])
    return res

@router.delete("")
async def delete_brand_kit(
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Clear all brand kit data (Admin/Customer only)."""
    res = await db["brand_kits"].delete_one({"user_id": ObjectId(current_user.id)})
    return {"message": "Brand kit deleted"}
