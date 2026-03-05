from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from api.deps import get_db, get_current_admin, get_current_user
from models.pricing import PricingTemplateBase, PricingTemplateCreate, PricingTemplateUpdate
from datetime import datetime, timezone
from bson import ObjectId

router = APIRouter()

@router.get("", response_model=List[dict])
async def list_templates(db=Depends(get_db)):
    cursor = db["pricing_templates"].find().sort("price", 1)
    templates = await cursor.to_list(length=100)
    for t in templates:
        t["id"] = str(t.pop("_id"))
    return templates

@router.post("", response_model=dict)
async def create_template(
    template: PricingTemplateCreate,
    db=Depends(get_db),
    current_user=Depends(get_current_admin)
):
    new_t = template.dict()
    new_t["created_at"] = datetime.now(timezone.utc)
    new_t["updated_at"] = new_t["created_at"]
    
    res = await db["pricing_templates"].insert_one(new_t)
    new_t["id"] = str(res.inserted_id)
    return new_t

@router.put("/{template_id}", response_model=dict)
async def update_template(
    template_id: str,
    template: PricingTemplateUpdate,
    db=Depends(get_db),
    current_user=Depends(get_current_admin)
):
    update_data = {k: v for k, v in template.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    res = await db["pricing_templates"].find_one_and_update(
        {"_id": ObjectId(template_id)},
        {"$set": update_data},
        return_document=True
    )
    
    if not res:
        raise HTTPException(status_code=404, detail="Template not found")
    
    res["id"] = str(res.pop("_id"))
    return res

@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_admin)
):
    res = await db["pricing_templates"].delete_one({"_id": ObjectId(template_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted"}
