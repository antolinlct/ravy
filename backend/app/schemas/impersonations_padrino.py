from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class ImpersonationsPadrino(BaseModel):
    id: Optional[UUID] = None
    actor_user_id: Optional[UUID] = None
    target_establishment_id: Optional[UUID] = None
    reason: Optional[str] = None
    started_at: Optional[dt.datetime] = None
    ended_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
