from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Mercuriales(BaseModel):
    id: Optional[str] = None
    market_supplier_id: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    created_at: Optional[datetime] = None
