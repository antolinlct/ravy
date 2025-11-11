from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


User_role = Literal["padrino", "owner", "admin", "manager", "staff"]

class UserEstablishment(BaseModel):
    user_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    role: Optional[User_role] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
