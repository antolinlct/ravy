from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Articles(BaseModel):
    id: Optional[str] = None
    invoice_id: Optional[str] = None
    establishment_id: Optional[str] = None
    supplier_id: Optional[str] = None
    date: Optional[date] = None
    name_raw: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    line_total: Optional[float] = None
    master_article_id: Optional[str] = None
