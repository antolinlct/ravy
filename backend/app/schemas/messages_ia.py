from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MessagesIa(BaseModel):
    id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    sender: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
