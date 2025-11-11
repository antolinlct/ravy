from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID


Score_type = Literal["global", "purchase", "recipe", "financial"]

class LiveScore(BaseModel):
    id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    establishment_id: Optional[UUID] = None
    type: Optional[Score_type] = None
    value: Optional[float] = None
