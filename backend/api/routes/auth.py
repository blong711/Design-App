from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.security import verify_password, get_password_hash, create_access_token
from models.user import UserResponse, UserCreate, ProfileUpdate, PasswordChange
from api.deps import get_db, get_current_user, get_current_admin

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_in: UserCreate, db=Depends(get_db)):
    """Public registration — account starts inactive until admin approves."""
    existing = await db["users"].find_one({"username": user_in.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    existing_email = await db["users"].find_one({"email": user_in.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_dict = user_in.dict()
    password = user_dict.pop("password")
    user_dict["hashed_password"] = get_password_hash(password)
    user_dict["role"] = "designer"
    user_dict["is_active"] = False  # Requires admin approval before login

    result = await db["users"].insert_one(user_dict)
    created = await db["users"].find_one({"_id": result.inserted_id})
    return UserResponse.from_mongo(created)

@router.post("/login")
async def login_access_token(db=Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db["users"].find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Inactive user")

    user_obj = UserResponse.from_mongo(user)
    access_token = create_access_token(subject=user_obj.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_obj.dict()
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user

@router.patch("/me/profile", response_model=UserResponse)
async def update_profile(
    profile_in: ProfileUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    update_data = {k: v for k, v in profile_in.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Check email uniqueness if changed
    if "email" in update_data and update_data["email"] != current_user.email:
        existing = await db["users"].find_one({"email": update_data["email"]})
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    from bson import ObjectId
    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_data}
    )
    updated = await db["users"].find_one({"_id": ObjectId(current_user.id)})
    return UserResponse.from_mongo(updated)

@router.post("/me/change-password")
async def change_password(
    data: PasswordChange,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    from bson import ObjectId
    user = await db["users"].find_one({"_id": ObjectId(current_user.id)})
    if not user or not verify_password(data.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")

    await db["users"].update_one(
        {"_id": ObjectId(current_user.id)},
        {"$set": {"hashed_password": get_password_hash(data.new_password)}}
    )
    return {"message": "Password changed successfully"}
