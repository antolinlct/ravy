from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class FinancialReports(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    month: Optional[date] = None
    purchases_total: Optional[float] = None
    sales_total: Optional[float] = None
    gross_margin: Optional[float] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
