from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyInDB
from api.deps import get_db, get_current_admin
import uuid

router = APIRouter()

@router.get("/", response_model=List[ApiKeyResponse])
async def read_api_keys(db=Depends(get_db), current_user=Depends(get_current_admin)):
    keys = await db["api_keys"].find().to_list(length=100)
    return [ApiKeyResponse.from_mongo(key) for key in keys]

@router.post("/", response_model=ApiKeyResponse)
async def create_api_key(api_key_in: ApiKeyCreate, db=Depends(get_db), current_user=Depends(get_current_admin)):
    # Generate a random key
    generated_key = str(uuid.uuid4())
    
    api_key_db = ApiKeyInDB(
        **api_key_in.dict(),
        key=generated_key
    )
    result = await db["api_keys"].insert_one(api_key_db.dict(by_alias=True))
    created_key = await db["api_keys"].find_one({"_id": result.inserted_id})
    return ApiKeyResponse.from_mongo(created_key)
