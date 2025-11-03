from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class MasterArticles(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    supplier_id: Optional[str] = None
    no_space_name: Optional[str] = None
    unit: Optional[str] = None
    market_master_article_id: Optional[str] = None
    active: Optional[bool] = None
    created_at: Optional[datetime] = None
