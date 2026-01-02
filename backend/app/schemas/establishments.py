from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Recommended_retail_price = Literal["MULTIPLIER", "PERCENTAGE", "VALUE"]
Sms_type = Literal["FOOD", "FOOD & BEVERAGES"]
Sms_variation_trigger = Literal["ALL", "±5%", "±10%"]

class Establishments(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    country_id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
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
    active_sms: Optional[bool] = None
    type_sms: Optional[Sms_type] = None
    sms_variation_trigger: Optional[Sms_variation_trigger] = None
    full_adresse: Optional[str] = None
    siren: Optional[str] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
