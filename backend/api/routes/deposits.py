from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from models.deposit import DepositRequestCreate, DepositRequestUpdate, DepositRequestInDB, DepositRequestResponse
from models.user import UserResponse
from api.deps import get_db, get_current_user, get_current_admin
from bson import ObjectId
from datetime import datetime, timezone
from models.transaction import TransactionInDB

router = APIRouter()

@router.get("/", response_model=List[DepositRequestResponse])
async def list_deposits(
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    
    if current_user.role == "customer":
        # Customers can only see their own requests
        query["user_id"] = current_user.id
    elif user_id:
        # Admins can filter by user_id
        query["user_id"] = user_id
        
    deposits = await db["deposits"].find(query).sort("created_at", -1).to_list(length=500)
    return [DepositRequestResponse.from_mongo(d) for d in deposits]

@router.post("/", response_model=DepositRequestResponse)
async def create_deposit(
    deposit_in: DepositRequestCreate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    if current_user.role != "customer":
        raise HTTPException(status_code=403, detail="Only customers can request deposits")

    deposit_data = deposit_in.model_dump()
    deposit_data["user_id"] = current_user.id
    deposit_data["status"] = "pending"
    
    deposit_db = DepositRequestInDB(**deposit_data)
    result = await db["deposits"].insert_one(deposit_db.model_dump(by_alias=True))
    created = await db["deposits"].find_one({"_id": result.inserted_id})
    return DepositRequestResponse.from_mongo(created)

@router.patch("/{id}/approve", response_model=DepositRequestResponse)
async def approve_deposit(
    id: str,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    deposit = await db["deposits"].find_one({"_id": ObjectId(id)})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit request not found")
    
    if deposit.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending deposits can be approved")

    # Update deposit status
    await db["deposits"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc)}}
    )

    # Increase user balance
    user_id = deposit.get("user_id")
    amount = deposit.get("amount")
    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"balance": amount}}
    )

    # Log Transaction
    tx = TransactionInDB(
        user_id=user_id,
        amount=amount,
        type="deposit",
        reference_id=id,
        description=f"Deposit of ${amount:.2f} approved"
    )
    await db["transactions"].insert_one(tx.model_dump(by_alias=True))

    updated = await db["deposits"].find_one({"_id": ObjectId(id)})
    return DepositRequestResponse.from_mongo(updated)

@router.patch("/{id}/reject", response_model=DepositRequestResponse)
async def reject_deposit(
    id: str,
    update_in: DepositRequestUpdate,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    deposit = await db["deposits"].find_one({"_id": ObjectId(id)})
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit request not found")
    
    if deposit.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending deposits can be rejected")

    await db["deposits"].update_one(
        {"_id": ObjectId(id)},
        {"$set": {
            "status": "rejected", 
            "admin_notes": update_in.admin_notes,
            "updated_at": datetime.now(timezone.utc)
        }}
    )

    updated = await db["deposits"].find_one({"_id": ObjectId(id)})
    return DepositRequestResponse.from_mongo(updated)
