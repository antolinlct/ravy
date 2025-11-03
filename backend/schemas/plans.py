from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Plans(BaseModel):
    id: Optional[str] = None
    code: Optional[str] = None
    name: Optional[str] = None
    stripe_price_id: Optional[str] = None
    active: Optional[bool] = None
    sort_order: Optional[int] = None
