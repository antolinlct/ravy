from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Ticket_status = Literal["open", "in progress", "resolved", "error", "canceled"]

class SupportTicket(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    user_profile_id: Optional[UUID] = None
    invoice_path: Optional[str] = None
    status: Optional[Ticket_status] = None
    object: Optional[str] = None
    description: Optional[str] = None
    intern_notes: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    ticket_id: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
