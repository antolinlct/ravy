from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class ImpersonationsPadrino(BaseModel):
    id: Optional[UUID] = None
    actor_user_id: Optional[UUID] = None
    target_establishment_id: Optional[UUID] = None
    reason: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
