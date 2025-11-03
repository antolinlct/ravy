from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class EstablishmentEmailAlias(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    alias_local_part: Optional[str] = None
    domain: Optional[str] = None
    enabled: Optional[bool] = None
    created_at: Optional[datetime] = None
