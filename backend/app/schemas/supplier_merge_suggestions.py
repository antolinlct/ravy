from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_merge_suggestions_status = Literal["pending", "accepted", "ignored", "dismissed"]

class SupplierMergeSuggestions(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    establishment_id: Optional[UUID] = None
    source_supplier_id: Optional[UUID] = None
    target_supplier_id: Optional[UUID] = None
    similarity_score: Optional[float] = None
    status: Optional[Supplier_merge_suggestions_status] = None
