from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class VatRates(BaseModel):
    id: Optional[str] = None
    country_id: Optional[str] = None
    name: Optional[str] = None
    percentage_rate: Optional[float] = None
    absolute_rate: Optional[float] = None
