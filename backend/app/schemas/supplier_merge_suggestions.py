from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_merge_suggestions_status = Literal["pending", "accepted", "ignored", "dismissed"]

class SupplierMergeSuggestions(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    reviewed_at: Optional[dt.datetime] = None
    establishment_id: Optional[UUID] = None
    target_market_supplier_id: Optional[UUID] = None
    similarity_score: Optional[float] = None
    status: Optional[Supplier_merge_suggestions_status] = None
    source_market_supplier_ids: Optional[dict] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
