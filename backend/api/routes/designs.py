from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from models.design import DesignCreate, DesignUpdate, DesignInDB, DesignResponse
from models.comment import CommentCreate, CommentInDB, CommentResponse
from models.user import UserResponse
from api.deps import get_db, get_current_user, get_current_admin
from bson import ObjectId
from datetime import datetime, timezone
from pydantic import BaseModel
from models.transaction import TransactionInDB

router = APIRouter()

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
        query["assigned_to"] = current_user.id
    elif current_user.role == "customer":
        # Customer sees only designs they created
        query["created_by"] = current_user.id
    else:
        # Admin sees everything, but can filter by assignee
        if assigned_to:
            query["assigned_to"] = assigned_to

    designs = await db["designs"].find(query).sort("created_at", -1).to_list(length=200)
    return [DesignResponse.from_mongo(d) for d in designs]

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
    return DesignResponse.from_mongo(created)

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

    return DesignResponse.from_mongo(d)

@router.put("/{id}", response_model=DesignResponse)
async def update_design(
    id: str,
    design_in: DesignUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    update_data = {k: v for k, v in design_in.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)

    # If assigning to a designer, validate and auto-set status to "assigned"
    if "assigned_to" in update_data:
        designer_id = update_data["assigned_to"]
        designer = await db["users"].find_one({"_id": ObjectId(designer_id), "role": "designer"})
        if not designer:
            raise HTTPException(status_code=404, detail="Designer not found")
        existing = await db["designs"].find_one({"_id": ObjectId(id)})
        if existing and existing.get("status") == "pending":
            update_data["status"] = "assigned"

    result = await db["designs"].update_one(
        {"_id": ObjectId(id)},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")

    updated = await db["designs"].find_one({"_id": ObjectId(id)})
    return DesignResponse.from_mongo(updated)

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

        update_fields["assigned_to"] = assign_data.assigned_to
        # Auto-promote status from pending -> assigned
        if d.get("status") == "pending":
            update_fields["status"] = "assigned"
    else:
        # Unassign - Note: We probably shouldn't refund automatically here without logic
        update_fields["assigned_to"] = None
        if d.get("status") == "assigned":
            update_fields["status"] = "pending"

    await db["designs"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    updated = await db["designs"].find_one({"_id": ObjectId(id)})
    return DesignResponse.from_mongo(updated)

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

    update_fields = {"status": status_update.status, "updated_at": datetime.now(timezone.utc)}
    if status_update.status == "completed":
        update_fields["completed_at"] = datetime.now(timezone.utc)

    await db["designs"].update_one({"_id": ObjectId(id)}, {"$set": update_fields})
    updated = await db["designs"].find_one({"_id": ObjectId(id)})
    return DesignResponse.from_mongo(updated)

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
    return DesignResponse.from_mongo(updated)

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
