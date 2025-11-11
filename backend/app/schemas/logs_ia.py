from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class LogsIa(BaseModel):
    id: Optional[UUID] = None
    session_id: Optional[UUID] = None
    action: Optional[str] = None
    input: Optional[dict] = None
    output: Optional[dict] = None
    success: Optional[bool] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
