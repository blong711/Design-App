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

@router.get("/designer/{user_id}/history")
async def get_designer_history(
    user_id: str,
    months: int = 6,
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
):
    """Designer monthly performance history for the past N months."""
    if current_user.role == "designer" and str(current_user.id) != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    now = datetime.now(timezone.utc)
    history = []

    for i in range(months - 1, -1, -1):
        # Calculate start/end of each past month
        target = now.replace(day=1) - timedelta(days=i * 28)  # approx
        # Normalize to first day of month
        year = target.year
        month = target.month
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(year, month)[1]
        end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)

        pipeline = [
            {"$match": {
                "assigned_to": ObjectId(user_id),
                "is_deleted": False,
                "status": "completed",
                "completed_at": {"$gte": start, "$lte": end}
            }},
            {"$group": {
                "_id": None,
                "completed": {"$sum": 1},
                "earnings": {"$sum": "$price"}
            }}
        ]
        result = await db["designs"].aggregate(pipeline).to_list(1)
        data = result[0] if result else {"completed": 0, "earnings": 0}
        history.append({
            "month": start.strftime("%b %Y"),
            "completed": data.get("completed", 0),
            "earnings": data.get("earnings", 0)
        })

    return history
@router.get("/revenue-history")
async def get_revenue_history(
    db=Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin)
):
    """Admin revenue history for the past 6 months."""
    now = datetime.now(timezone.utc)
    history = []
    
    # Track the 6 most recent months (including current one)
    for i in range(5, -1, -1):
        # Calculate month correctly
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
            
        start = datetime(year, month, 1, tzinfo=timezone.utc)
        last_day = calendar.monthrange(year, month)[1]
        end = datetime(year, month, last_day, 23, 59, 59, tzinfo=timezone.utc)
        
        pipeline = [
            {"$match": {
                "is_deleted": False,
                "status": "completed",
                "completed_at": {"$gte": start, "$lte": end}
            }},
            {"$group": {
                "_id": None,
                "revenue": {"$sum": "$price"},
                "count": {"$sum": 1}
            }}
        ]
        
        result = await db["designs"].aggregate(pipeline).to_list(1)
        data = result[0] if result else {"revenue": 0, "count": 0}
        
        history.append({
            "month": start.strftime("%b %Y"),
            "revenue": data.get("revenue", 0),
            "count": data.get("count", 0)
        })
        
    return history
