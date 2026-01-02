from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_merge_request_status = Literal["pending", "to_confirm", "accepted", "resolved", "refused"]

class SupplierMergeRequest(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[dt.datetime] = None
    status: Optional[Supplier_merge_request_status] = None
    source_market_supplier_ids: Optional[dict] = None
    target_market_supplier_id: Optional[UUID] = None
    requesting_establishment_id: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
