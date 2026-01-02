from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Mercuriale_level = Literal["STANDARD", "PLUS", "PREMIUM"]

class UserMercurialeAccess(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    mercuriale_level: Optional[Mercuriale_level] = None
    assigned_by: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
