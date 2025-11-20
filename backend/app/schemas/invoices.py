from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Import_mode = Literal["EMAIL", "FILEUPLOADER", "MANUALLY"]

class Invoices(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    invoice_number: Optional[str] = None
    date: Optional[date] = None
    total_excl_tax: Optional[float] = None
    total_tax: Optional[float] = None
    total_incl_tax: Optional[float] = None
    file_storage_path: Optional[str] = None
    created_at: Optional[datetime] = None
    import_mode: Optional[Import_mode] = None
    updated_at: Optional[datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None
