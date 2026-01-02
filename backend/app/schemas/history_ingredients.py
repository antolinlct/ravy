from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class HistoryIngredients(BaseModel):
    id: Optional[UUID] = None
    ingredient_id: Optional[UUID] = None
    recipe_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    master_article_id: Optional[UUID] = None
    subrecipe_id: Optional[UUID] = None
    unit_cost: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    version_number: Optional[float] = None
    created_at: Optional[dt.datetime] = None
    gross_unit_price: Optional[float] = None
    percentage_loss: Optional[float] = None
    date: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    loss_value: Optional[float] = None
    unit_cost_per_portion_recipe: Optional[float] = None
    source_article_id: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
