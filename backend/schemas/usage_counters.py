from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class UsageCounters(BaseModel):
    subscription_id: Optional[str] = None
    establishment_id: Optional[str] = None
    feature_key: Optional[str] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    used_value: Optional[float] = None
