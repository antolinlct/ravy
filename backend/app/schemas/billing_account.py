from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Billing_cycle = Literal["monthly", "yearly"]

class BillingAccount(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    stripe_customer_id_prod: Optional[str] = None
    stripe_customer_id_live: Optional[str] = None
    billing_cycle: Optional[Billing_cycle] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    free_mode: Optional[bool] = None
    stripe_subscription_id_prod: Optional[str] = None
    stripe_subscription_id_live: Optional[str] = None
    current_period_end: Optional[dt.datetime] = None
    current_period_start: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
