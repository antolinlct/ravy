from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Addon_category = Literal["seat", "invoices", "recipe"]

class UsageCounters(BaseModel):
    establishment_id: Optional[UUID] = None
    period_start: Optional[dt.datetime] = None
    period_end: Optional[dt.datetime] = None
    used_value: Optional[float] = None
    id: Optional[UUID] = None
    limit_value: Optional[float] = None
    value_category: Optional[Addon_category] = None
    updated_at: Optional[dt.datetime] = None
    created_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
