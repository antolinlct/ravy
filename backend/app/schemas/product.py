from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Product_type = Literal["plan", "addon"]
Addon_category = Literal["seat", "invoices", "recipe"]

class Product(BaseModel):
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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
