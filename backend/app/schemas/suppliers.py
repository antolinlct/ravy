from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_label = Literal["FOOD", "BEVERAGES", "FIXED COSTS", "VARIABLE COSTS", "OTHER"]

class Suppliers(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    name: Optional[str] = None
    market_supplier_id: Optional[UUID] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    active: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    active_analyses: Optional[bool] = None
    label: Optional[Supplier_label] = None
