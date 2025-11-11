from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class Maintenance(BaseModel):
    id: Optional[UUID] = None
    coutdown_hour: Optional[float] = None
    is_active: Optional[bool] = None
    message: Optional[str] = None
    start_date: Optional[datetime] = None
