from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Regex_type = Literal["supplier_name", "market_master_article_name", "master_article_alternative"]

class RegexPatterns(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    type: Optional[Regex_type] = None
    regex: Optional[str] = None
