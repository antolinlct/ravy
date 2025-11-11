from typing import Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Query

from app.logic.read.market_comparator import market_comparator

router = APIRouter(
    prefix="/market",
    tags=["Market - Comparator"]
)


@router.get("/comparator", response_model=Dict[str, Any])
def get_market_comparator(
    market_master_article_1_id: str,
    market_master_article_2_id: str,
    establishment_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    only_my_invoices_product1: bool = Query(False),
    only_my_invoices_product2: bool = Query(False),
):
    """
    Compare deux produits marché (market_master_articles) entre eux :
    - Produit 1 = référence
    - Produit 2 = comparaison
    - Peut inclure ou non les données personnelles ("Seulement mes factures")
    - Retourne les statistiques complètes pour chaque produit + les écarts € et %
    """
    return market_comparator(
        market_master_article_1_id=market_master_article_1_id,
        market_master_article_2_id=market_master_article_2_id,
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
        only_my_invoices_product1=only_my_invoices_product1,
        only_my_invoices_product2=only_my_invoices_product2,
    )
