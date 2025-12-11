from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class ScoreMatrix(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    purchase_result: Optional[float] = None
    financial_result: Optional[float] = None
    score: Optional[float] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
