from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class SubscriptionAppliedFeatures(BaseModel):
    subscription_id: Optional[str] = None
    feature_key: Optional[str] = None
    feature_value: Optional[float] = None
    enabled: Optional[bool] = None
