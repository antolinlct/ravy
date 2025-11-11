from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class UserProfiles(BaseModel):
    id: Optional[UUID] = None
    first_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_name: Optional[str] = None
    intern_notes: Optional[str] = None
