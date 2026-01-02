from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class LogsIa(BaseModel):
    id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    action: Optional[str] = None
    input: Optional[dict] = None
    output: Optional[dict] = None
    success: Optional[bool] = None
    error_message: Optional[str] = None
    created_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
