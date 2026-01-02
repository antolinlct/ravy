from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class Maintenance(BaseModel):
    id: Optional[UUID] = None
    coutdown_hour: Optional[float] = None
    is_active: Optional[bool] = None
    message: Optional[str] = None
    start_date: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
