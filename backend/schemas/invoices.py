from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Invoices(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    supplier_id: Optional[str] = None
    invoice_number: Optional[str] = None
    date: Optional[date] = None
    currency: Optional[str] = None
    total_excl_tax: Optional[float] = None
    total_tax: Optional[float] = None
    total_incl_tax: Optional[float] = None
    file_storage_path: Optional[str] = None
    created_at: Optional[datetime] = None
