from pydantic import BaseModel
from datetime import datetime, date
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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    loss_value: Optional[float] = None
