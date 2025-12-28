from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_label = Literal["FOOD", "BEVERAGES", "FIXED COSTS", "VARIABLE COSTS", "OTHER"]

class MercurialeSupplier(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    market_supplier_id: Optional[UUID] = None
    label: Optional[Supplier_label] = None
    mercurial_logo_path: Optional[str] = None
    active: Optional[bool] = None
    name: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
