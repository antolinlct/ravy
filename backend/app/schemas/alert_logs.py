from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class AlertLogs(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    content: Optional[str] = None
    payload: Optional[dict] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    sent_to_number: Optional[str] = None
    sent_to_id: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
