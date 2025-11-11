from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class RecipeMarginCategory(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    date: Optional[datetime] = None
    average_margin: Optional[float] = None
    establishment_id: Optional[UUID] = None
    responsible_recipe: Optional[UUID] = None
    cagtegory_id: Optional[UUID] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
