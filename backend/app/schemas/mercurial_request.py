from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MercurialRequest(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    user_profile_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    message: Optional[str] = None
    internal_notes: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
