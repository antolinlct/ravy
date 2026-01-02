from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class VatRates(BaseModel):
    id: Optional[UUID] = None
    country_id: Optional[UUID] = None
    name: Optional[str] = None
    percentage_rate: Optional[float] = None
    absolute_rate: Optional[float] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
