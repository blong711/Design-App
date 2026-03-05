from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class BrandColor(BaseModel):
    name: str = "Primary"
    hex: str = "#000000"

class BrandAsset(BaseModel):
    name: str
    url: str
    type: str = "logo" # logo, pattern, background

class BrandKitBase(BaseModel):
    brand_name: Optional[str] = None
    description: Optional[str] = None
    primary_font: Optional[str] = "Inter"
    secondary_font: Optional[str] = "Roboto"
    colors: List[BrandColor] = []
    assets: List[BrandAsset] = []

class BrandKitCreate(BrandKitBase):
    pass

class BrandKitUpdate(BrandKitBase):
    pass

class BrandKitInDB(BrandKitBase):
    user_id: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
