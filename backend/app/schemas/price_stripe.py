from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Billing_cycle = Literal["monthly", "yearly"]

class PriceStripe(BaseModel):
    id: Optional[UUID] = None
    product_id: Optional[UUID] = None
    billing_cycle: Optional[Billing_cycle] = None
    stripe_price_id_prod: Optional[str] = None
    stripe_price_id_live: Optional[str] = None
    unit_amount: Optional[float] = None
    is_active: Optional[bool] = None
    created_at: Optional[datetime] = None
