from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class Countries(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    currency_iso_code: Optional[str] = None
    currency_symbol: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    stripe_tax_id_prod: Optional[str] = None
    stripe_tax_id_live: Optional[str] = None
