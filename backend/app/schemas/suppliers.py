from pydantic import BaseModel
import datetime as dt
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
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    active_analyses: Optional[bool] = None
    label: Optional[Supplier_label] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
