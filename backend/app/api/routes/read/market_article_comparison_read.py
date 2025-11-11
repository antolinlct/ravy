from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
from datetime import date
from app.logic.read.market_article_comparison import market_article_comparison

router = APIRouter(prefix="/market", tags=["Market - Article Comparison"])


@router.get("/articles/{master_article_id}/comparison", response_model=Dict[str, Any])
def get_market_article_comparison(
    master_article_id: str,
    establishment_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    """
    Compare les prix et quantités d’un master_article utilisateur avec les données marché.

    Paramètres :
    - master_article_id : ID du master_article (lié à un market_master_article)
    - establishment_id : ID de l’établissement utilisateur
    - start_date / end_date : bornes temporelles (par défaut = mois courant)

    Retourne :
    - Détails du master_article et du market_master_article lié
    - Moyenne et quantité utilisateur
    - Moyenne, min, max marché
    - Différence moyenne et économies potentielles (€)
    - Listes des articles et market_articles correspondants
    """
    return market_article_comparison(
        master_article_id=master_article_id,
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
    )
