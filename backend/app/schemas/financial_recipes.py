from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class FinancialRecipes(BaseModel):
    id: Optional[UUID] = None
    financial_report_id: Optional[UUID] = None
    recipe_id: Optional[UUID] = None
    sales_number: Optional[float] = None
    total_revenue: Optional[float] = None
    total_cost: Optional[float] = None
    total_margin: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    balanced_margin: Optional[float] = None
