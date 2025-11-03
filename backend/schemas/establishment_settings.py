from pydantic import BaseModel
from datetime import datetime, date
from typing import List, Optional, Any, Literal


Pricing_strategy_method = Literal["TARGET_MARGIN", "MARKUP_ON_COST", "CUSTOM_FORMULA"]
Variation_filter_mode = Literal["ALL_VARIATIONS", "OVER_5_PERCENT", "OVER_10_PERCENT"]

class EstablishmentSettings(BaseModel):
    establishment_id: Optional[str] = None
    pricing_method: Optional[Pricing_strategy_method] = None
    pricing_params: Optional[dict] = None
    variation_filter_mode: Optional[Variation_filter_mode] = None
    variation_settings: Optional[dict] = None
    live_score_settings: Optional[dict] = None
    updated_at: Optional[datetime] = None
