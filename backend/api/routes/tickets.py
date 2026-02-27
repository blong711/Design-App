from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from models.ticket import TicketCreate, TicketUpdate, TicketInDB, TicketResponse
from models.user import UserResponse
from api.deps import get_db, get_current_user, get_current_admin
from bson import ObjectId
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter()

@router.get("/", response_model=List[TicketResponse])
async def list_tickets(
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    payment_status: Optional[str] = None,
    db=Depends(get_db), 
    current_user: UserResponse = Depends(get_current_user)
):
    query = {"is_deleted": False}
    if status:
        query["status"] = status
    if payment_status:
        query["payment_status"] = payment_status

    if current_user.role == "designer":
        # Designer sees only their assigned tickets
        query["assigned_to"] = current_user.id
    else:
        if assigned_to:
            query["assigned_to"] = assigned_to

    tickets = await db["design_tickets"].find(query).sort("created_at", -1).to_list(length=200)
    return [TicketResponse.from_mongo(t) for t in tickets]

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_in: TicketCreate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    ticket_db = TicketInDB(**ticket_in.dict())
    result = await db["design_tickets"].insert_one(ticket_db.dict(by_alias=True))
    created = await db["design_tickets"].find_one({"_id": result.inserted_id})
    return TicketResponse.from_mongo(created)

@router.get("/{id}", response_model=TicketResponse)
async def get_ticket(id: str, db=Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    t = await db["design_tickets"].find_one({"_id": ObjectId(id), "is_deleted": False})
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Designers can only view their own
    if current_user.role == "designer" and str(t.get("assigned_to")) != current_user.id:
         raise HTTPException(status_code=403, detail="Forbidden")

    return TicketResponse.from_mongo(t)

@router.put("/{id}", response_model=TicketResponse)
async def update_ticket(
    id: str,
    ticket_in: TicketUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    update_data = {k: v for k, v in ticket_in.dict(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db["design_tickets"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")

    updated = await db["design_tickets"].find_one({"_id": ObjectId(id)})
    return TicketResponse.from_mongo(updated)

class StatusUpdate(BaseModel):
    status: str

@router.patch("/{id}/status", response_model=TicketResponse)
async def update_status(
    id: str,
    status_update: StatusUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    t = await db["design_tickets"].find_one({"_id": ObjectId(id)})
    if not t:
         raise HTTPException(status_code=404, detail="Ticket not found")
         
    if current_user.role == "designer" and str(t.get("assigned_to")) != current_user.id:
         raise HTTPException(status_code=403, detail="Forbidden")

    update_fields = {"status": status_update.status, "updated_at": datetime.now(timezone.utc)}
    if status_update.status == "completed":
        update_fields["completed_at"] = datetime.now(timezone.utc)

    await db["design_tickets"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    updated = await db["design_tickets"].find_one({"_id": ObjectId(id)})
    return TicketResponse.from_mongo(updated)

class ResultUpdate(BaseModel):
    result_link: str

@router.patch("/{id}/result", response_model=TicketResponse)
async def update_result(
    id: str,
    result_update: ResultUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    t = await db["design_tickets"].find_one({"_id": ObjectId(id)})
    if not t:
         raise HTTPException(status_code=404, detail="Ticket not found")
         
    if current_user.role == "designer" and str(t.get("assigned_to")) != current_user.id:
         raise HTTPException(status_code=403, detail="Forbidden")

    update_fields = {"result_link": result_update.result_link, "updated_at": datetime.now(timezone.utc)}
    await db["design_tickets"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    updated = await db["design_tickets"].find_one({"_id": ObjectId(id)})
    return TicketResponse.from_mongo(updated)

class BulkPayRequest(BaseModel):
    designer_id: str

@router.patch("/bulk-pay", response_model=dict)
async def bulk_pay_tickets(
    pay_data: BulkPayRequest,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    result = await db["design_tickets"].update_many(
        {
            "assigned_to": pay_data.designer_id,
            "status": "completed",
            "payment_status": "unpaid",
            "is_deleted": False
        },
        {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": f"Successfully paid {result.modified_count} tickets"}
