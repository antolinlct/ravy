from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class Countries(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    currency_iso_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    stripe_tax_id_prod: Optional[str] = None
    stripe_tax_id_live: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
