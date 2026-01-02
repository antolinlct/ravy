from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class MercurialRequest(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    user_profile_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    message: Optional[str] = None
    internal_notes: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
