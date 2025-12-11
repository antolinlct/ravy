from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Logs_type = Literal["context", "job"]
Logs_action = Literal["login", "logout", "create", "update", "delete", "view", "import"]
Logs_element_type = Literal["invoice", "recipe", "supplier", "financial_reports", "user", "establishment", "variation"]

class Logs(BaseModel):
    created_at: Optional[datetime] = None
    user_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    type: Optional[Logs_type] = None
    action: Optional[Logs_action] = None
    text: Optional[str] = None
    json: Optional[dict] = None
    element_id: Optional[UUID] = None
    element_type: Optional[Logs_element_type] = None
    id: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
