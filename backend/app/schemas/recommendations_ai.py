from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class RecommendationsAi(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    context: Optional[dict] = None
    suggestion: Optional[str] = None
    estimated_impact: Optional[float] = None
    accepted: Optional[bool] = None
    created_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
