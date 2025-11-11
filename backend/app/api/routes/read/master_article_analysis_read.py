from typing import Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Query

from app.logic.read.master_article_analysis import master_article_analysis

router = APIRouter(
    prefix="/master-articles",
    tags=["Master Articles - Analysis"],
)

@router.get("/{master_article_id}/analysis", response_model=Dict[str, Any])
def get_master_article_analysis(
    master_article_id: str,
    establishment_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    """
    Analyse un master_article sur une période :
    - stats (prix moyen/min/max, total & moyenne de quantité, total dépensé, prix first/last)
    - articles liés sur la période
    - factures correspondantes
    """
    return master_article_analysis(
        master_article_id=master_article_id,
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
    )
