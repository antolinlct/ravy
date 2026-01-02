from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class MessagesIa(BaseModel):
    id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    sender: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
