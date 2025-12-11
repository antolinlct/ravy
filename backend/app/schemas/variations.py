from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class Variations(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    master_article_id: Optional[UUID] = None
    date: Optional[date] = None
    old_unit_price: Optional[float] = None
    new_unit_price: Optional[float] = None
    percentage: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    alert_logs_id: Optional[UUID] = None
    is_viewed: Optional[bool] = None
    invoice_id: Optional[UUID] = None
    is_deleted: Optional[bool] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
