from pydantic import BaseModel
import datetime as dt
from typing import List, Optional, Any, Literal
from uuid import UUID


Import_mode = Literal["EMAIL", "FILEUPLOADER", "MANUALLY"]

class Invoices(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    invoice_number: Optional[str] = None
    date: Optional[dt.date] = None
    total_excl_tax: Optional[float] = None
    total_tax: Optional[float] = None
    total_incl_tax: Optional[float] = None
    file_storage_path: Optional[str] = None
    created_at: Optional[dt.datetime] = None
    import_mode: Optional[Import_mode] = None
    updated_at: Optional[dt.datetime] = None
    created_by: Optional[UUID] = None
    updated_by: Optional[UUID] = None

    class Config:
        json_encoders = {
            UUID: lambda v: str(v),
            dt.datetime: lambda v: v.isoformat() if isinstance(v, dt.datetime) else v,
            dt.date: lambda v: v.isoformat() if isinstance(v, dt.date) else v,
        }
