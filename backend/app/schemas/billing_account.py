from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Billing_cycle = Literal["monthly", "yearly"]

class BillingAccount(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    stripe_customer_id_prod: Optional[str] = None
    stripe_customer_id_live: Optional[str] = None
    billing_cycle: Optional[Billing_cycle] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    free_mode: Optional[bool] = None
    stripe_subscription_id_prod: Optional[str] = None
    stripe_subscription_id_live: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
