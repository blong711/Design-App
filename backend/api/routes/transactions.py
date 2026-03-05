from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from models.transaction import TransactionResponse, TransactionInDB
from models.user import UserResponse
from api.deps import get_db, get_current_user, get_current_admin
from bson import ObjectId

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    user_id: Optional[str] = None,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    query = {}
    
    if current_user.role == "customer":
        # Customers can only see their own transactions
        query["user_id"] = current_user.id
    elif user_id:
        # Admins can filter by user_id
        query["user_id"] = user_id
    elif current_user.role != "admin":
         # Other roles (designers) only see their own if any
         query["user_id"] = current_user.id
        
    pipeline = [
        {"$match": query},
        {"$sort": {"created_at": -1}},
        {"$limit": 500},
        {
            "$addFields": {
                "user_id_obj": {"$toObjectId": "$user_id"}
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "user_id_obj",
                "foreignField": "_id",
                "as": "user_info"
            }
        },
        {
            "$unwind": {
                "path": "$user_info",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$addFields": {
                "user_full_name": "$user_info.full_name",
                "user_email": "$user_info.email"
            }
        },
        {
            "$project": {
                "user_info": 0,
                "user_id_obj": 0
            }
        }
    ]
    
    transactions = await db["transactions"].aggregate(pipeline).to_list(length=500)
    return [TransactionResponse.from_mongo(t) for t in transactions]
