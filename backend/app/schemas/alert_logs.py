from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class AlertLogs(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    content: Optional[str] = None
    payload: Optional[dict] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    sent_to_number: Optional[str] = None
    sent_to_id: Optional[UUID] = None
