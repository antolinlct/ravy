from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Ingredient_type = Literal["ARTICLE", "FIXED", "SUBRECIPE"]

class Ingredients(BaseModel):
    id: Optional[UUID] = None
    recipe_id: Optional[UUID] = None
    type: Optional[Ingredient_type] = None
    master_article_id: Optional[UUID] = None
    subrecipe_id: Optional[UUID] = None
    unit_cost: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    percentage_loss: Optional[float] = None
    gross_unit_price: Optional[float] = None
    establishment_id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    loss_value: Optional[float] = None
    unit_cost_per_portion_recipe: Optional[float] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
