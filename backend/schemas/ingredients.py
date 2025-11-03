from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal


Ingredient_type = Literal["ARTICLE", "FIXED", "SUBRECIPE"]

class Ingredients(BaseModel):
    id: Optional[str] = None
    recipe_id: Optional[str] = None
    type: Optional[Ingredient_type] = None
    master_article_id: Optional[str] = None
    subrecipe_id: Optional[str] = None
    fixed_unit_cost: Optional[float] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
