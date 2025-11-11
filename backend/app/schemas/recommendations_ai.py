from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal
from uuid import UUID



class RecommendationsAi(BaseModel):
    id: Optional[UUID] = None
    establishment_id: Optional[UUID] = None
    context: Optional[dict] = None
    suggestion: Optional[str] = None
    estimated_impact: Optional[float] = None
    accepted: Optional[bool] = None
    created_at: Optional[datetime] = None
