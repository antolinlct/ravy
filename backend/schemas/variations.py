from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Variations(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    master_article_id: Optional[str] = None
    date: Optional[date] = None
    old_unit_price: Optional[float] = None
    new_unit_price: Optional[float] = None
    percentage: Optional[float] = None
