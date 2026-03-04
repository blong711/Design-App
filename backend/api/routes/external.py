from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from models.design import DesignCreate, DesignInDB, DesignResponse
from api.deps import get_db

router = APIRouter()

API_KEY_NAME = "x-api-key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key_system(
    api_key_header: str = Security(api_key_header),
    db=Depends(get_db)
):
    key_doc = await db["api_keys"].find_one({"key": api_key_header, "is_active": True})
    if not key_doc:
        raise HTTPException(status_code=403, detail="Could not validate credentials")
    return key_doc

@router.post("/designs", response_model=DesignResponse)
async def create_external_design(
    design_in: DesignCreate,
    system_key=Depends(get_api_key_system),
    db=Depends(get_db)
):
    """
    Called by an external system using the x-api-key header.
    """
    design_data = design_in.model_dump()
    design_data["external_source"] = system_key.get("system_name", "Unknown System")
    design_db = DesignInDB(**design_data)
    
    result = await db["designs"].insert_one(design_db.model_dump(by_alias=True))
    created = await db["designs"].find_one({"_id": result.inserted_id})
    return DesignResponse.from_mongo(created)
