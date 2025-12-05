from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MercurialeSubcategories(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    name: Optional[str] = None
    category_id: Optional[UUID] = None
