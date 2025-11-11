from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class MarketArticles(BaseModel):
    id: Optional[UUID] = None
    market_master_article_id: Optional[UUID] = None
    date: Optional[datetime] = None
    unit_price: Optional[float] = None
    file_path: Optional[str] = None
    unit: Optional[str] = None
    market_supplier_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    discounts: Optional[float] = None
    duties_and_taxes: Optional[float] = None
    establishment_id: Optional[UUID] = None
    invoice_path: Optional[str] = None
