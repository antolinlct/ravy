from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MasterArticles(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    unformatted_name: Optional[str] = None
    unit: Optional[str] = None
    market_master_article_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    current_unit_price: Optional[float] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    name: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
