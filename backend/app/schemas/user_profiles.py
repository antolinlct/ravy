from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class UserProfiles(BaseModel):
    id: Optional[UUID] = None
    first_name: Optional[str] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    last_name: Optional[str] = None
    intern_notes: Optional[str] = None
    phone_sms: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
