from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class FinancialRecipes(BaseModel):
    id: Optional[str] = None
    financial_report_id: Optional[str] = None
    recipe_id: Optional[str] = None
    qty_produced: Optional[float] = None
    avg_unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    margin_rate: Optional[float] = None
    margin_value: Optional[float] = None
