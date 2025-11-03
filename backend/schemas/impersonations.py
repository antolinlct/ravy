from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Impersonations(BaseModel):
    id: Optional[str] = None
    actor_user_id: Optional[str] = None
    target_user_id: Optional[str] = None
    reason: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
