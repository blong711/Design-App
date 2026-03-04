from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.security import verify_password, get_password_hash, create_access_token
from models.user import UserResponse, UserCreate, ProfileUpdate, PasswordChange
from api.deps import get_db, get_current_user, get_current_admin
from core.email import send_verification_email
import secrets

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
async def register(user_in: UserCreate, db=Depends(get_db)):
    """Public registration — account starts inactive until email is verified."""
    existing = await db["users"].find_one({"username": user_in.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    existing_email = await db["users"].find_one({"email": user_in.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Generate verification token
    verification_token = secrets.token_urlsafe(32)

    user_dict = user_in.dict()
    password = user_dict.pop("password")
    user_dict["hashed_password"] = get_password_hash(password)
    user_dict["role"] = "customer"
    user_dict["is_active"] = False  # Inactive until email verified
    user_dict["email_verified"] = False
    user_dict["verification_token"] = verification_token

    result = await db["users"].insert_one(user_dict)
    created = await db["users"].find_one({"_id": result.inserted_id})
    
    # Send verification email
    await send_verification_email(
        email=user_in.email,
        token=verification_token,
        full_name=user_in.full_name
    )
    
    return UserResponse.from_mongo(created)

@router.post("/resend-verification")
async def resend_verification(email: str, db=Depends(get_db)):
    """Resend verification email to user."""
    user = await db["users"].find_one({"email": email})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists and is unverified, a verification link has been sent."}
    
    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new verification token
    verification_token = secrets.token_urlsafe(32)
    
    from bson import ObjectId
    await db["users"].update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": {"verification_token": verification_token}}
    )
    
    # Send verification email
    await send_verification_email(
        email=email,
        token=verification_token,
        full_name=user.get("full_name", "User")
    )
    
    return {"message": "If the email exists and is unverified, a verification link has been sent."}

@router.post("/verify-email")
async def verify_email(token: str, db=Depends(get_db)):
    """Verify user email with token."""
    user = await db["users"].find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    if user.get("email_verified"):
        raise HTTPException(status_code=400, detail="Email already verified")
    
    from bson import ObjectId
    # Update user to verified and active
    await db["users"].update_one(
        {"_id": ObjectId(user["_id"])},
        {
            "$set": {
                "email_verified": True,
                "is_active": True,
                "verification_token": None
            }
        }
    )
    
    return {"message": "Email verified successfully. You can now login."}

@router.post("/login")
async def login_access_token(db=Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db["users"].find_one({"username": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    elif not user.get("email_verified") and user.get("role") != "admin":
        raise HTTPException(status_code=400, detail="Please verify your email address before logging in")
    elif not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Inactive user")

    user_obj = UserResponse.from_mongo(user)
    access_token = create_access_token(subject=user_obj.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_obj.dict()
    }

@router.post("/impersonate/{user_id}")
async def impersonate_user(
    user_id: str,
    db=Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    from bson import ObjectId
    user = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=400, detail="Target user is inactive")

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
