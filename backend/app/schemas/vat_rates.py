from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class VatRates(BaseModel):
    id: Optional[UUID] = None
    country_id: Optional[UUID] = None
    name: Optional[str] = None
    percentage_rate: Optional[float] = None
    absolute_rate: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
