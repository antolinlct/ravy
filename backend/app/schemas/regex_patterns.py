from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Regex_type = Literal["supplier_name", "market_master_article_name", "master_article_alternative"]

class RegexPatterns(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    type: Optional[Regex_type] = None
    regex: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
