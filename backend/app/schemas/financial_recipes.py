from pydantic import BaseModel
import datetime as dt
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
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    balanced_margin: Optional[float] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
