from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_label = Literal["FOOD", "BEVERAGES", "FIXED COSTS", "VARIABLE COSTS", "OTHER"]

class MercurialeSupplier(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    market_supplier_id: Optional[UUID] = None
    label: Optional[Supplier_label] = None
    mercurial_logo_path: Optional[str] = None
    active: Optional[bool] = None
    name: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
