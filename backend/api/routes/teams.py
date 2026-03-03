from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from models.team import TeamCreate, TeamUpdate, TeamInDB, TeamResponse
from api.deps import get_db, get_current_admin
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

@router.get("/", response_model=List[TeamResponse])
async def list_teams(db=Depends(get_db), current_user=Depends(get_current_admin)):
    teams = await db["teams"].find().to_list(length=100)
    return [TeamResponse.from_mongo(t) for t in teams]

@router.post("/", response_model=TeamResponse)
async def create_team(team_in: TeamCreate, db=Depends(get_db), current_user=Depends(get_current_admin)):
    team_db = TeamInDB(**team_in.model_dump())
    result = await db["teams"].insert_one(team_db.model_dump(by_alias=True))
    created = await db["teams"].find_one({"_id": result.inserted_id})
    return TeamResponse.from_mongo(created)

@router.get("/{id}", response_model=TeamResponse)
async def get_team(id: str, db=Depends(get_db), current_user=Depends(get_current_admin)):
    team = await db["teams"].find_one({"_id": ObjectId(id)})
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return TeamResponse.from_mongo(team)

@router.put("/{id}", response_model=TeamResponse)
async def update_team(id: str, team_in: TeamUpdate, db=Depends(get_db), current_user=Depends(get_current_admin)):
    update_data = {k: v for k, v in team_in.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db["teams"].update_one({"_id": ObjectId(id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    
    updated = await db["teams"].find_one({"_id": ObjectId(id)})
    return TeamResponse.from_mongo(updated)

@router.delete("/{id}")
async def delete_team(id: str, db=Depends(get_db), current_user=Depends(get_current_admin)):
    # Check if users are still in this team
    users_in_team = await db["users"].find_one({"team_id": ObjectId(id)})
    if users_in_team:
        raise HTTPException(status_code=400, detail="Cannot delete team with active users")
        
    result = await db["teams"].delete_one({"_id": ObjectId(id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team deleted successfully"}
