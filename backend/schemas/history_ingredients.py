from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal


Ingredient_type = Literal["ARTICLE", "FIXED", "SUBRECIPE"]

class HistoryIngredients(BaseModel):
    id: Optional[str] = None
    ingredient_id: Optional[str] = None
    recipe_id: Optional[str] = None
    establishment_id: Optional[str] = None
    type: Optional[Ingredient_type] = None
    master_article_id: Optional[str] = None
    subrecipe_id: Optional[str] = None
    fixed_unit_cost: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    version_number: Optional[int] = None
    edited_by: Optional[str] = None
    created_at: Optional[datetime] = None
