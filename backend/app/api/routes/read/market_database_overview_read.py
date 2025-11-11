from datetime import date
from typing import Optional, Dict, Any
from fastapi import APIRouter, Query

from app.logic.read.market_database_overview import market_database_overview

router = APIRouter(prefix="/market", tags=["Market - Database Overview"])

@router.get("/overview", response_model=Dict[str, Any])
def get_market_database_overview(
    establishment_id: str,
    supplier_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    include_user_comparison: bool = Query(True),
    period_range: Optional[int] = Query(
        3, description="Durée préconfigurée si aucune date: 3, 6 ou 12 (mois)"
    ),
):
    """
    Vue complète 'bourse' du marché par fournisseur → produits.
    - Période : dates explicites OU 3/6/12 mois (fallback 3).
    - Avec enrichissements UX + comparaison utilisateur.
    """
    return market_database_overview(
        establishment_id=establishment_id,
        supplier_id=supplier_id,
        start_date=start_date,
        end_date=end_date,
        include_user_comparison=include_user_comparison,
        period_range=period_range,
    )
