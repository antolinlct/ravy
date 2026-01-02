from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class MercurialeMasterArticle(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    mercurial_supplier_id: Optional[UUID] = None
    name: Optional[str] = None
    unit: Optional[str] = None
    vat_rate: Optional[float] = None
    active: Optional[bool] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    market_master_article: Optional[UUID] = None
    category_id: Optional[UUID] = None
    subcategory_id: Optional[UUID] = None
    race_name: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
