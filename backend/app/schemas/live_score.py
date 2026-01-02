from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Score_type = Literal["global", "purchase", "recipe", "financial"]

class LiveScore(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    establishment_id: Optional[UUID] = None
    type: Optional[Score_type] = None
    value: Optional[float] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
