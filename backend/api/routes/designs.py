from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Union
from models.design import DesignCreate, DesignUpdate, DesignInDB, DesignResponse
from models.comment import CommentCreate, CommentInDB, CommentResponse
from models.status_history import StatusHistoryInDB, StatusHistoryResponse
from models.user import UserResponse
from api.deps import get_db, get_current_user, get_current_admin
from bson import ObjectId
from datetime import datetime, timezone
from pydantic import BaseModel
from models.transaction import TransactionInDB

router = APIRouter()

# Helper function to log status changes
async def log_status_change(db, design_id: str, old_status: Optional[str], new_status: str, user_id: str, user_name: str):
    if old_status != new_status:
        history_entry = StatusHistoryInDB(
            design_id=design_id,
            old_status=old_status,
            new_status=new_status,
            changed_by=user_id,
            changed_by_name=user_name
        )
        await db["status_history"].insert_one(history_entry.model_dump(by_alias=True, exclude=["id"]))

# Helper function to build populated DesignResponse
async def get_populated_design_response(db, d: dict, comment_count: int = 0) -> DesignResponse:
    if not d:
        return None
    assigned_user = None
    if d.get("assigned_to"):
        user = await db["users"].find_one({"_id": ObjectId(d["assigned_to"])})
        if user:
            assigned_user = {
                "id": str(user["_id"]),
                "username": user["username"],
                "full_name": user["full_name"]
            }
    return DesignResponse.from_mongo(d, comment_count=comment_count, assigned_user=assigned_user)

@router.get("/", response_model=List[DesignResponse])
async def list_designs(
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
        # Designer sees only their assigned designs
        query["assigned_to"] = ObjectId(current_user.id)
    elif current_user.role == "customer":
        # Customer sees only designs they created
        query["created_by"] = current_user.id
    else:
        # Admin sees everything, but can filter by assignee
        if assigned_to:
            query["assigned_to"] = ObjectId(assigned_to)

    designs = await db["designs"].find(query).sort("created_at", -1).to_list(length=200)
    
    # Fetch comment counts for each design
    design_ids = [d["_id"] for d in designs]
    comment_counts = {}
    if design_ids:
        pipeline = [
            {"$match": {"design_id": {"$in": design_ids}}},
            {"$group": {"_id": "$design_id", "count": {"$sum": 1}}}
        ]
        comment_results = await db["design_comments"].aggregate(pipeline).to_list(length=None)
        comment_counts = {str(r["_id"]): r["count"] for r in comment_results}
    
    return [DesignResponse.from_mongo(d, comment_counts.get(str(d["_id"]), 0)) for d in designs]

@router.post("/", response_model=DesignResponse)
async def create_design(
    design_in: DesignCreate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    design_data = design_in.model_dump()
    design_data["created_by"] = current_user.id
    design_data["payment_status"] = "unpaid"

    # If customer is creating, force price to 0 and ignore assignment
    if current_user.role == "customer":
        design_data["price"] = 0.0
        design_data["status"] = "pending"
        design_data["assigned_to"] = None
    else:
        assigned_to_str = design_data.pop("assigned_to", None)
        if assigned_to_str:
            # Validate designer exists
            designer_query = {"_id": ObjectId(assigned_to_str), "role": "designer"}
            designer = await db["users"].find_one(designer_query)
            if not designer:
                raise HTTPException(status_code=404, detail="Designer not found")
            
            design_data["status"] = "assigned"
            design_data["assigned_to"] = ObjectId(assigned_to_str)
        else:
            design_data["status"] = "pending"
            design_data["assigned_to"] = None

    design_db = DesignInDB(**design_data)
    result = await db["designs"].insert_one(design_db.model_dump(by_alias=True))
    created = await db["designs"].find_one({"_id": result.inserted_id})
    return await get_populated_design_response(db, created)

@router.get("/{id}", response_model=DesignResponse)
async def get_design(id: str, db=Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    d = await db["designs"].find_one({"_id": ObjectId(id), "is_deleted": False})
    if not d:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Designers can only view their own
    if current_user.role == "designer" and str(d.get("assigned_to")) != current_user.id:
         raise HTTPException(status_code=403, detail="Forbidden")
    
    # Customers can only view their own
    if current_user.role == "customer" and str(d.get("created_by")) != current_user.id:
         raise HTTPException(status_code=403, detail="Forbidden")

    return await get_populated_design_response(db, d)

@router.put("/{id}", response_model=DesignResponse)
async def update_design(
    id: str,
    design_in: DesignUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    existing = await db["designs"].find_one({"_id": ObjectId(id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Design not found")
    
    old_status = existing.get("status")
    update_data = {k: v for k, v in design_in.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    # If assigning to a designer, validate and auto-set status to "assigned"
    if "assigned_to" in update_data:
        designer_id = update_data["assigned_to"]
        designer = await db["users"].find_one({"_id": ObjectId(designer_id), "role": "designer"})
        if not designer:
            raise HTTPException(status_code=404, detail="Designer not found")
        if existing.get("status") == "pending":
            update_data["status"] = "assigned"

    result = await db["designs"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")

    # Log status change if status was updated
    if "status" in update_data:
        await log_status_change(db, id, old_status, update_data["status"], current_user.id, current_user.full_name)

    updated = await db["designs"].find_one({"_id": ObjectId(id)})
    return await get_populated_design_response(db, updated)

class AssignUpdate(BaseModel):
    assigned_to: Optional[str] = None

@router.patch("/{id}/assign", response_model=DesignResponse)
async def assign_design(
    id: str,
    assign_data: AssignUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    """Assign or unassign a design to/from a designer."""
    d = await db["designs"].find_one({"_id": ObjectId(id), "is_deleted": False})
    if not d:
        raise HTTPException(status_code=404, detail="Design not found")

    old_status = d.get("status")
    update_fields = {"updated_at": datetime.now(timezone.utc)}

    if assign_data.assigned_to:
        designer = await db["users"].find_one({"_id": ObjectId(assign_data.assigned_to), "role": "designer"})
        if not designer:
            raise HTTPException(status_code=404, detail="Designer not found")

        
        # Check if price is set (Admin should have set it by now or is setting it)
        # We need the current design or we should allow setting price in this call too?
        # The design model has price. Let's check if the design has a price > 0.
        price = d.get("price") or 0.0
        if price <= 0:
             raise HTTPException(status_code=400, detail="Cannot assign design without a set price. Please set price first.")

        # Deduct balance from customer
        customer_id = d.get("created_by")
        customer = await db["users"].find_one({"_id": ObjectId(customer_id)})
        if not customer:
             raise HTTPException(status_code=404, detail="Customer not found")
        
        if customer.get("balance", 0) < price:
             raise HTTPException(status_code=400, detail=f"Insufficient customer balance. (Balance: ${customer.get('balance', 0)}, Required: ${price})")

        # Atomic deduction
        result = await db["users"].update_one(
            {"_id": ObjectId(customer_id), "balance": {"$gte": price}},
            {"$inc": {"balance": -price}}
        )
        if result.modified_count == 0:
             raise HTTPException(status_code=400, detail="Failed to deduct balance. Insufficient funds.")

        # Log Transaction
        tx = TransactionInDB(
            user_id=customer_id,
            amount=-price,
            type="design_payment",
            reference_id=id,
            description=f"Payment for design: {d.get('title')}"
        )
        await db["transactions"].insert_one(tx.model_dump(by_alias=True))
        update_fields["assigned_to"] = ObjectId(assign_data.assigned_to)
        # Auto-promote status from pending -> assigned
        if d.get("status") == "pending":
            update_fields["status"] = "assigned"
    else:
        # Unassign - Note: We probably shouldn't refund automatically here without logic
        update_fields["assigned_to"] = None
        if d.get("status") == "assigned":
            update_fields["status"] = "pending"

    await db["designs"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    
    # Log status change if status was changed
    if "status" in update_fields and update_fields["status"] != old_status:
        await log_status_change(db, id, old_status, update_fields["status"], current_user.id, current_user.full_name)
    
    updated = await db["designs"].find_one({"_id": ObjectId(id)})
    return await get_populated_design_response(db, updated)

class StatusUpdate(BaseModel):
    status: str

@router.patch("/{id}/status", response_model=DesignResponse)
async def update_status(
    id: str,
    status_update: StatusUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    d = await db["designs"].find_one({"_id": ObjectId(id)})
    if not d:
         raise HTTPException(status_code=404, detail="Design not found")
         
    if current_user.role == "designer" and str(d.get("assigned_to")) != current_user.id:
         raise HTTPException(status_code=403, detail="Forbidden")

    old_status = d.get("status")
    update_fields = {"status": status_update.status, "updated_at": datetime.now(timezone.utc)}
    if status_update.status == "completed":
        update_fields["completed_at"] = datetime.now(timezone.utc)

    await db["designs"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    
    # Log status change
    await log_status_change(db, id, old_status, status_update.status, current_user.id, current_user.full_name)
    
    updated = await db["designs"].find_one({"_id": ObjectId(id)})
    return await get_populated_design_response(db, updated)

class ResultUpdate(BaseModel):
    result_link: str

@router.patch("/{id}/result", response_model=DesignResponse)
async def update_result(
    id: str,
    result_update: ResultUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    d = await db["designs"].find_one({"_id": ObjectId(id)})
    if not d:
         raise HTTPException(status_code=404, detail="Design not found")
         
    if current_user.role == "designer" and str(d.get("assigned_to")) != current_user.id:
         raise HTTPException(status_code=403, detail="Forbidden")

    update_fields = {"result_link": result_update.result_link, "updated_at": datetime.now(timezone.utc)}
    await db["designs"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    updated = await db["designs"].find_one({"_id": ObjectId(id)})
    return await get_populated_design_response(db, updated)

class BulkPayRequest(BaseModel):
    designer_id: str

@router.patch("/bulk-pay", response_model=dict)
async def bulk_pay_designs(
    pay_data: BulkPayRequest,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    result = await db["designs"].update_many(
        {
            "assigned_to": pay_data.designer_id,
            "status": "completed",
            "payment_status": "unpaid",
            "is_deleted": False
        },
        {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc)}}
    )
    return {"message": f"Successfully paid {result.modified_count} designs"}

# ─── Design Comments ──────────────────────────────────────────────────────────

@router.get("/{id}/comments", response_model=List[CommentResponse])
async def list_design_comments(
    id: str,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """List all comments for a specific design."""
    comments = await db["design_comments"].find({"design_id": ObjectId(id)}).sort("created_at", 1).to_list(length=500)
    return [CommentResponse.from_mongo(c) for c in comments]

@router.post("/{id}/comments", response_model=CommentResponse)
async def create_design_comment(
    id: str,
    comment_in: CommentCreate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Add a new comment to a design."""
    # Validate design exists
    design = await db["designs"].find_one({"_id": ObjectId(id)})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Check permission (Admins can comment on any, Designers only on assigned)
    if current_user.role == "designer" and str(design.get("assigned_to")) != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    comment_db = CommentInDB(
        content=comment_in.content,
        design_id=ObjectId(id),
        user_id=current_user.id,
        user_name=current_user.full_name
    )
    
    result = await db["design_comments"].insert_one(comment_db.model_dump(by_alias=True))
    created = await db["design_comments"].find_one({"_id": result.inserted_id})
    return CommentResponse.from_mongo(created)

@router.get("/{id}/activity")
async def get_design_activity(
    id: str,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get combined activity timeline (comments + status changes) for a design."""
    # Get design to check access
    design = await db["designs"].find_one({"_id": ObjectId(id)})
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Check permission
    if current_user.role == "designer" and str(design.get("assigned_to")) != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Fetch comments
    comments = await db["design_comments"].find({"design_id": ObjectId(id)}).to_list(length=500)
    comment_items = [
        {
            **CommentResponse.from_mongo(c).model_dump(),
            "type": "comment"
        }
        for c in comments
    ]
    
    # Fetch status history
    status_history = await db["status_history"].find({"design_id": id}).to_list(length=500)
    status_items = [
        StatusHistoryResponse.from_mongo(s).model_dump()
        for s in status_history
    ]
    
    # Combine and sort by created_at
    all_activity = comment_items + status_items
    all_activity.sort(key=lambda x: x["created_at"])
    
    return all_activity
