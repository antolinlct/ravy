from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class RecipesSubcategories(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    name: Optional[str] = None
    category_id: Optional[UUID] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
