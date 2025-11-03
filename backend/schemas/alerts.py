from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Alerts(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    type: Optional[str] = None
    payload: Optional[dict] = None
    sent_at: Optional[datetime] = None
