from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class Recipes(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    name: Optional[str] = None
    vat_id: Optional[UUID] = None
    recommanded_retail_price: Optional[float] = None
    active: Optional[bool] = None
    created_at: Optional[datetime] = None
    saleable: Optional[bool] = None
    contains_sub_recipe: Optional[bool] = None
    purchase_cost_total: Optional[float] = None
    portion: Optional[float] = None
    purchase_cost_per_portion: Optional[float] = None
    technical_data_sheet_instructions: Optional[str] = None
    current_margin: Optional[float] = None
    portion_weight: Optional[float] = None
    price_excl_tax: Optional[float] = None
    price_incl_tax: Optional[float] = None
    price_tax: Optional[float] = None
    category_id: Optional[UUID] = None
    subcategory_id: Optional[UUID] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
    technical_data_sheet_image_path: Optional[str] = None
