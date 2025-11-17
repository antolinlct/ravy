from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class HistoryRecipes(BaseModel):
    id: Optional[UUID] = None
    recipe_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    version_number: Optional[float] = None
    created_at: Optional[datetime] = None
    date: Optional[datetime] = None
    purchase_cost_total: Optional[float] = None
    purchase_cost_per_portion: Optional[float] = None
    portion: Optional[float] = None
    invoice_affected: Optional[bool] = None
    vat_id: Optional[UUID] = None
    price_excl_tax: Optional[float] = None
    price_incl_tax: Optional[float] = None
    price_tax: Optional[float] = None
    margin: Optional[float] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
