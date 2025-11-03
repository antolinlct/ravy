from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal


Owner_type = Literal["USER", "ESTABLISHMENT"]

class BillingAccounts(BaseModel):
    id: Optional[str] = None
    owner_type: Optional[Owner_type] = None
    owner_user_id: Optional[str] = None
    owner_establishment_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    created_at: Optional[datetime] = None
