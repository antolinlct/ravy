from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class SessionsIa(BaseModel):
    id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    context: Optional[dict] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
