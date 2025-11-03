from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Recommendations(BaseModel):
    id: Optional[str] = None
    establishment_id: Optional[str] = None
    context: Optional[dict] = None
    suggestion: Optional[str] = None
    estimated_impact: Optional[float] = None
    accepted: Optional[bool] = None
    created_at: Optional[datetime] = None
