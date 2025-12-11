from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MercurialeMasterArticle(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
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
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
