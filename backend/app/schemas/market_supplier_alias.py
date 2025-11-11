from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MarketSupplierAlias(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    supplier_market_id: Optional[UUID] = None
    alias: Optional[str] = None
