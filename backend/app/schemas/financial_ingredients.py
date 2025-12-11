from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class FinancialIngredients(BaseModel):
    id: Optional[UUID] = None
    financial_report_id: Optional[UUID] = None
    master_article_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
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
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
