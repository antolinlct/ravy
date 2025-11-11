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
