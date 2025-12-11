from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MercurialeArticles(BaseModel):
    id: Optional[UUID] = None
    mercuriale_id: Optional[UUID] = None
    mercurial_master_article_id: Optional[UUID] = None
    price_standard: Optional[float] = None
    price_plus: Optional[float] = None
    price_premium: Optional[float] = None
    active: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
