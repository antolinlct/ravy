from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class MercurialeArticles(BaseModel):
    id: Optional[str] = None
    mercuriale_id: Optional[str] = None
    market_master_article_id: Optional[str] = None
    unit: Optional[str] = None
    weight: Optional[float] = None
    price_standard: Optional[float] = None
    price_plus: Optional[float] = None
    price_premium: Optional[float] = None
    vat_rate: Optional[float] = None
    active: Optional[bool] = None
    created_at: Optional[datetime] = None
