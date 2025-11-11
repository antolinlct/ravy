from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Supplier_label = Literal["FOOD", "BEVERAGES", "FIXED COSTS", "VARIABLE COSTS", "OTHER"]

class LabelSupplier(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    label: Optional[Supplier_label] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
