from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.user import UserCreate, UserResponse, UserInDB
from api.deps import get_db, get_current_admin
from core.security import get_password_hash

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
