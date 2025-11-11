from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MessagesIa(BaseModel):
    id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    sender: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: Optional[datetime] = None
