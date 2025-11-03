from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal


Mercuriale_level = Literal["STANDARD", "PLUS", "PREMIUM"]

class UserMercurialeAccess(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    mercuriale_level: Optional[Mercuriale_level] = None
    assigned_by: Optional[str] = None
    assigned_at: Optional[datetime] = None
