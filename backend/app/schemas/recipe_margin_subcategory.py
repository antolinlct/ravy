from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class RecipeMarginSubcategory(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    date: Optional[dt.datetime] = None
    average_margin: Optional[float] = None
    establishment_id: Optional[UUID] = None
    responsible_recipe: Optional[UUID] = None
    subcategory_id: Optional[UUID] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
