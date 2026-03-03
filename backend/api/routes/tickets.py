from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from models.ticket import TicketCreate, TicketUpdate, TicketInDB, TicketResponse
from models.comment import CommentCreate, CommentInDB, CommentResponse
from models.user import UserResponse
from api.deps import get_db, get_current_user, get_current_admin, get_current_manager
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
    elif current_user.role == "manager":
        # Manager sees only tickets in their team
        if not current_user.team_id:
            return [] # Manager without team sees nothing
        query["team_id"] = ObjectId(current_user.team_id)
    else:
        # Admin sees everything, but can filter by assignee
        if assigned_to:
            query["assigned_to"] = assigned_to

    tickets = await db["design_tickets"].find(query).sort("created_at", -1).to_list(length=200)
    return [TicketResponse.from_mongo(t) for t in tickets]

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_in: TicketCreate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_manager)
):
    ticket_data = ticket_in.model_dump()
    ticket_data["created_by"] = current_user.id
    ticket_data["payment_status"] = "unpaid"

    # Team Scoping
    if current_user.role == "manager":
        if not current_user.team_id:
            raise HTTPException(status_code=400, detail="Manager must belong to a team to create tickets")
        ticket_data["team_id"] = ObjectId(current_user.team_id)
    # Admin can optionally specify team_id if we added it to TicketCreate, 
    # but for now let's just use None or handle it if we want.

    assigned_to_str = ticket_data.pop("assigned_to", None)
    if assigned_to_str:
        # Validate designer exists
        designer_query = {"_id": ObjectId(assigned_to_str), "role": "designer"}
        if current_user.role == "manager":
            designer_query["team_id"] = ObjectId(current_user.team_id)
            
        designer = await db["users"].find_one(designer_query)
        if not designer:
            raise HTTPException(status_code=404, detail="Designer not found in your team")
            
        ticket_data["status"] = "assigned"
        ticket_data["assigned_to"] = ObjectId(assigned_to_str)
    else:
        ticket_data["status"] = "pending"
        ticket_data["assigned_to"] = None

    ticket_db = TicketInDB(**ticket_data)
    result = await db["design_tickets"].insert_one(ticket_db.model_dump(by_alias=True))
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
    update_data = {k: v for k, v in ticket_in.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    # If assigning to a designer, validate and auto-set status to "assigned"
    if "assigned_to" in update_data:
        designer_id = update_data["assigned_to"]
        designer = await db["users"].find_one({"_id": ObjectId(designer_id), "role": "designer"})
        if not designer:
            raise HTTPException(status_code=404, detail="Designer not found")
        existing = await db["design_tickets"].find_one({"_id": ObjectId(id)})
        if existing and existing.get("status") == "pending":
            update_data["status"] = "assigned"

    result = await db["design_tickets"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")

    updated = await db["design_tickets"].find_one({"_id": ObjectId(id)})
    return TicketResponse.from_mongo(updated)

class AssignUpdate(BaseModel):
    assigned_to: Optional[str] = None

@router.patch("/{id}/assign", response_model=TicketResponse)
async def assign_ticket(
    id: str,
    assign_data: AssignUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    """Assign or unassign a ticket to/from a designer."""
    t = await db["design_tickets"].find_one({"_id": ObjectId(id), "is_deleted": False})
    if not t:
        raise HTTPException(status_code=404, detail="Ticket not found")

    update_fields = {"updated_at": datetime.now(timezone.utc)}

    if assign_data.assigned_to:
        designer = await db["users"].find_one({"_id": ObjectId(assign_data.assigned_to), "role": "designer"})
        if not designer:
            raise HTTPException(status_code=404, detail="Designer not found")
        update_fields["assigned_to"] = assign_data.assigned_to
        # Auto-promote status from pending -> assigned
        if t.get("status") == "pending":
            update_fields["status"] = "assigned"
    else:
        # Unassign
        update_fields["assigned_to"] = None
        if t.get("status") == "assigned":
            update_fields["status"] = "pending"

    await db["design_tickets"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
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

# ─── Ticket Comments ──────────────────────────────────────────────────────────

@router.get("/{id}/comments", response_model=List[CommentResponse])
async def list_ticket_comments(
    id: str,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """List all comments for a specific ticket."""
    comments = await db["ticket_comments"].find({"ticket_id": ObjectId(id)}).sort("created_at", 1).to_list(length=500)
    return [CommentResponse.from_mongo(c) for c in comments]

@router.post("/{id}/comments", response_model=CommentResponse)
async def create_ticket_comment(
    id: str,
    comment_in: CommentCreate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a new comment to a ticket."""
    # Validate ticket exists
    ticket = await db["design_tickets"].find_one({"_id": ObjectId(id)})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Check permission (Admins can comment on any, Designers only on assigned)
    if current_user.role == "designer" and str(ticket.get("assigned_to")) != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    comment_db = CommentInDB(
        content=comment_in.content,
        ticket_id=ObjectId(id),
        user_id=current_user.id,
        user_name=current_user.full_name
    )
    
    result = await db["ticket_comments"].insert_one(comment_db.model_dump(by_alias=True))
    created = await db["ticket_comments"].find_one({"_id": result.inserted_id})
    return CommentResponse.from_mongo(created)
