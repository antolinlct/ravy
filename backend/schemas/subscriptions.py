from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Subscriptions(BaseModel):
    id: Optional[str] = None
    billing_account_id: Optional[str] = None
    plan_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    status: Optional[str] = None
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    cancel_at_period_end: Optional[bool] = None
