from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class Mercuriales(BaseModel):
    id: Optional[UUID] = None
    market_supplier_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    effective_from: Optional[datetime] = None
    effective_to: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
