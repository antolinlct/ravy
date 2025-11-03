from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Establishments(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    slug: Optional[str] = None
    country_id: Optional[str] = None
    vat_default_id: Optional[str] = None
    archived_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
