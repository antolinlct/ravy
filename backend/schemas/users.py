from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Users(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    display_name: Optional[str] = None
    phone: Optional[str] = None
    super_admin: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
