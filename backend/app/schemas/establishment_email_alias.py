from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class EstablishmentEmailAlias(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    custom_email: Optional[str] = None
    enabled: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    custom_email_prefix: Optional[str] = None
