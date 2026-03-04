from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.user import UserCreate, UserResponse, UserInDB, UserUpdate
from api.deps import get_db, get_current_user, get_current_admin
from core.security import get_password_hash
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def read_users(db=Depends(get_db), current_user=Depends(get_current_admin)):
    users = await db["users"].find().to_list(length=100)
    return [UserResponse.from_mongo(user) for user in users]

@router.post("/", response_model=UserResponse)
async def create_user(user_in: UserCreate, db=Depends(get_db), current_user=Depends(get_current_admin)):
    existing = await db["users"].find_one({"username": user_in.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    existing_email = await db["users"].find_one({"email": user_in.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_db = UserInDB(
        **user_in.dict(exclude={"password"}),
        hashed_password=get_password_hash(user_in.password)
    )
    result = await db["users"].insert_one(user_db.dict(by_alias=True))
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserResponse.from_mongo(created_user)

@router.get("/{user_id}", response_model=UserResponse)
async def read_user(user_id: str, db=Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.from_mongo(user)

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_in: UserUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_admin)
):
    update_data = {k: v for k, v in user_in.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    updated = await db["users"].find_one({"_id": ObjectId(user_id)})
    return UserResponse.from_mongo(updated)

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_admin)
):
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    result = await db["users"].delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "User deleted successfully"}

