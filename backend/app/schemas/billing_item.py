from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class BillingItem(BaseModel):
    id: Optional[UUID] = None
    billling_acount_id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    price_id: Optional[UUID] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
