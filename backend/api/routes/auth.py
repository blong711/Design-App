from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from core.security import verify_password, create_access_token
from models.user import UserResponse
from api.deps import get_db, get_current_user

router = APIRouter()

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
