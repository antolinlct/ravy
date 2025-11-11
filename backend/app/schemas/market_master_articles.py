from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MarketMasterArticles(BaseModel):
    id: Optional[UUID] = None
    market_supplier_id: Optional[UUID] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    unformatted_name: Optional[str] = None
    current_unit_price: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
