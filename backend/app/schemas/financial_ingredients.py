from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class FinancialIngredients(BaseModel):
    id: Optional[UUID] = None
    financial_report_id: Optional[UUID] = None
    master_article_id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    financial_recipe_id: Optional[UUID] = None
    ingredient_id: Optional[UUID] = None
    quantity: Optional[float] = None
    consumed_value: Optional[float] = None
    accumulated_loss: Optional[float] = None
    market_gap_value: Optional[float] = None
    market_gap_percentage: Optional[float] = None
    market_total_savings: Optional[float] = None
    market_balanced: Optional[float] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
