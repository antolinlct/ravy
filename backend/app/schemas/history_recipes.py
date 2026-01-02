from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID



class HistoryRecipes(BaseModel):
    id: Optional[UUID] = None
    recipe_id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    version_number: Optional[float] = None
    created_at: Optional[dt.datetime] = None
    date: Optional[dt.datetime] = None
    purchase_cost_total: Optional[float] = None
    purchase_cost_per_portion: Optional[float] = None
    portion: Optional[float] = None
    invoice_affected: Optional[bool] = None
    vat_id: Optional[UUID] = None
    price_excl_tax: Optional[float] = None
    price_incl_tax: Optional[float] = None
    price_tax: Optional[float] = None
    margin: Optional[float] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
