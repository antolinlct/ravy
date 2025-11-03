from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal


Establishment_role = Literal["ADMIN", "MANAGER", "STAFF", "VIEWER"]

class UserEstablishment(BaseModel):
    user_id: Optional[str] = None
    establishment_id: Optional[str] = None
    role: Optional[Establishment_role] = None
    created_at: Optional[datetime] = None
