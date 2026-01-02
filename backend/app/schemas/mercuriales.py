from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class Mercuriales(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    effective_from: Optional[dt.datetime] = None
    effective_to: Optional[dt.datetime] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    mercuriale_supplier_id: Optional[UUID] = None
    market_supplier_id: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
