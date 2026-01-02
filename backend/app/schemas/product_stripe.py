from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Product_type = Literal["plan", "addon"]
Addon_category = Literal["seat", "invoices", "recipe"]

class ProductStripe(BaseModel):
    id: Optional[UUID] = None
    internal_code: Optional[str] = None
    marketing_name: Optional[str] = None
    plan_or_addon: Optional[Product_type] = None
    description: Optional[str] = None
    stripe_product_id_prod: Optional[str] = None
    stripe_product_id_live: Optional[str] = None
    included_seats: Optional[float] = None
    included_invoices: Optional[float] = None
    included_recipes: Optional[float] = None
    addon_category: Optional[Addon_category] = None
    addon_value: Optional[float] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
