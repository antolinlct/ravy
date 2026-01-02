from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class Articles(BaseModel):
    id: Optional[UUID] = None
    invoice_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    date: Optional[dt.date] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    total: Optional[float] = None
    master_article_id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    discounts: Optional[float] = None
    duties_and_taxes: Optional[float] = None
    gross_unit_price: Optional[float] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
