from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Suppliers(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    name: Optional[str] = None
    market_supplier_id: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    active: Optional[bool] = None
    created_at: Optional[datetime] = None
