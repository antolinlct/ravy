from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Recipes(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    vat_id: Optional[str] = None
    target_margin_rate: Optional[float] = None
    active: Optional[bool] = None
    created_at: Optional[datetime] = None
