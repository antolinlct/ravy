from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Addon_category = Literal["seat", "invoices", "recipe"]

class UsageCounters(BaseModel):
    establishment_id: Optional[UUID] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    used_value: Optional[float] = None
    id: Optional[UUID] = None
    limit_value: Optional[float] = None
    value_category: Optional[Addon_category] = None
    updated_at: Optional[datetime] = None
