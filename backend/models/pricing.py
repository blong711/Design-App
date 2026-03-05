from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PricingTemplateBase(BaseModel):
    name: str
    price: float
    description: Optional[str] = None

class PricingTemplateCreate(PricingTemplateBase):
    pass

class PricingTemplateUpdate(PricingTemplateBase):
    name: Optional[str] = None
    price: Optional[float] = None

class PricingTemplateInDB(PricingTemplateBase):
    id: str
    created_at: datetime
    updated_at: datetime
