from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MercurialRequest(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    user_profile_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    message: Optional[str] = None
    internal_notes: Optional[str] = None
