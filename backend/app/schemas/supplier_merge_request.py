from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_merge_request_status = Literal["pending", "to_confirm", "accepted", "resolved", "refused"]

class SupplierMergeRequest(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    status: Optional[Supplier_merge_request_status] = None
    source_market_supplier_ids: Optional[dict] = None
    target_market_supplier_id: Optional[UUID] = None
    requesting_establishment_id: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if isinstance(v, datetime) else v,
            date: lambda v: v.isoformat() if isinstance(v, date) else v,
        }
