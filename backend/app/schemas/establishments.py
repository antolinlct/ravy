from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Recommended_retail_price = Literal["MULTIPLIER", "PERCENTAGE", "VALUE"]

class Establishments(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    country_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    recommended_retail_price_method: Optional[Recommended_retail_price] = None
    recommended_retail_price_value: Optional[float] = None
    logo_path: Optional[str] = None
    plan_id: Optional[UUID] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    average_daily_covers: Optional[float] = None
    average_annual_revenue: Optional[float] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    intern_notes: Optional[str] = None
