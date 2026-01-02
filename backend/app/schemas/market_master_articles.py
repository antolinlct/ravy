from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class MarketMasterArticles(BaseModel):
    id: Optional[UUID] = None
    market_supplier_id: Optional[UUID] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    unformatted_name: Optional[str] = None
    current_unit_price: Optional[float] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    is_active: Optional[bool] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
