from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from api.deps import get_db, get_current_admin, get_current_user
from models.user import UserResponse
from datetime import datetime, timezone, timedelta
import calendar
from bson import ObjectId

router = APIRouter()

@router.get("/overview")
async def get_overview(
    db=Depends(get_db), 
    current_user: UserResponse = Depends(get_current_admin)
):
    """Admin Overview Analytics"""
    
    query = {"is_deleted": False}

    # Simple aggregates without complex pipelines for MVP, or we can use $match and $group
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "total_designs": {"$sum": 1},
            "total_unpaid": {
                "$sum": {
                    "$cond": [{"$eq": ["$payment_status", "unpaid"]}, "$price", 0]
                }
            },
            "total_paid": {
                "$sum": {
                    "$cond": [{"$eq": ["$payment_status", "paid"]}, "$price", 0]
                }
            },
            "completed_designs": {
                "$sum": {
                    "$cond": [{"$eq": ["$status", "completed"]}, 1, 0]
                }
            }
        }}
    ]
    
    result = await db["designs"].aggregate(pipeline).to_list(1)
    if not result:
        return {
            "total_designs": 0,
            "completed_designs": 0,
            "total_unpaid": 0,
            "total_paid": 0
        }
    
    data = result[0]
    data.pop("_id", None)
    return data

@router.get("/designer/{user_id}")
async def get_designer_stats(
    user_id: str,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Designer specific stats for the current month"""
    
    # Security check: Designer can only see their own stats
    if current_user.role == "designer" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these stats")
        
    now = datetime.now(timezone.utc)
    start_of_month = datetime(now.year, now.month, 1, tzinfo=timezone.utc)
    
    pipeline = [
        {"$match": {
            "assigned_to": ObjectId(user_id),
            "is_deleted": False,
            "created_at": {"$gte": start_of_month}
        }},
        {"$group": {
            "_id": None,
            "total_designs_this_month": {"$sum": 1},
            "completed_this_month": {
                "$sum": {"$cond": [{"$eq": ["$status", "completed"]}, 1, 0]}
            },
            "earnings_this_month": {
                "$sum": {
                    "$cond": [{"$eq": ["$status", "completed"]}, "$price", 0]
                }
            }
        }}
    ]

    result = await db["designs"].aggregate(pipeline).to_list(1)
    
    # Also get unpaid balance across all time
    unpaid_pipeline = [
        {"$match": {
            "assigned_to": ObjectId(user_id),
            "is_deleted": False,
            "status": "completed",
            "payment_status": "unpaid"
        }},
        {"$group": {
            "_id": None,
            "total_unpaid": {"$sum": "$price"}
        }}
    ]
    unpaid_result = await db["designs"].aggregate(unpaid_pipeline).to_list(1)

    stats = result[0] if result else {
        "total_designs_this_month": 0,
        "completed_this_month": 0,
        "earnings_this_month": 0
    }
    stats.pop("_id", None)
    
    stats["total_unpaid"] = unpaid_result[0]["total_unpaid"] if unpaid_result else 0
    
    return stats
