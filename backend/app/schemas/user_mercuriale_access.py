from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Mercuriale_level = Literal["STANDARD", "PLUS", "PREMIUM"]

class UserMercurialeAccess(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    mercuriale_level: Optional[Mercuriale_level] = None
    assigned_by: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
