from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class Variations(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    master_article_id: Optional[UUID] = None
    date: Optional[dt.date] = None
    old_unit_price: Optional[float] = None
    new_unit_price: Optional[float] = None
    percentage: Optional[float] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    alert_logs_id: Optional[UUID] = None
    is_viewed: Optional[bool] = None
    invoice_id: Optional[UUID] = None
    is_deleted: Optional[bool] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
