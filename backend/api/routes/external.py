from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader
from models.ticket import TicketCreate, TicketInDB, TicketResponse
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

@router.post("/designs", response_model=TicketResponse)
async def create_external_design(
    ticket_in: TicketCreate,
    system_key=Depends(get_api_key_system),
    db=Depends(get_db)
):
    """
    Called by an external system using the x-api-key header.
    """
    ticket_data = ticket_in.dict()
    ticket_data["external_source"] = system_key.get("system_name", "Unknown System")
    ticket_db = TicketInDB(**ticket_data)
    
    result = await db["design_tickets"].insert_one(ticket_db.dict(by_alias=True))
    created = await db["design_tickets"].find_one({"_id": result.inserted_id})
    return TicketResponse.from_mongo(created)
