from pydantic import BaseModel
import datetime as dt
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
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
