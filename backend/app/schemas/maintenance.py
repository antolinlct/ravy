from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class Maintenance(BaseModel):
    id: Optional[UUID] = None
    coutdown_hour: Optional[float] = None
    is_active: Optional[bool] = None
    message: Optional[str] = None
    start_date: Optional[datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
