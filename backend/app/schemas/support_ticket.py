from pydantic import BaseModel
import datetime as dt
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
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    resolved_at: Optional[dt.datetime] = None
    ticket_id: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
