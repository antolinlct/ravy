from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class FinancialIngredients(BaseModel):
    id: Optional[str] = None
    financial_report_id: Optional[str] = None
    master_article_id: Optional[str] = None
    qty_total: Optional[float] = None
    avg_unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
