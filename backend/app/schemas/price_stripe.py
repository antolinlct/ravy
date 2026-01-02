from pydantic import BaseModel
import datetime as dt
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
    created_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
