from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal



class Countries(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    iso_code: Optional[str] = None
    currency_code: Optional[str] = None
    currency_symbol: Optional[str] = None
