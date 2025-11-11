from typing import Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Query

from app.logic.read.master_article_recipes_analysis import master_article_impact_analysis

router = APIRouter(
    prefix="/master-articles",
    tags=["Master Articles - Recipes Analysis"]
)


@router.get("/{master_article_id}/recipes-analysis", response_model=Dict[str, Any])
def get_master_article_recipes_analysis(
    master_article_id: str,
    establishment_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    """
    Analyse toutes les recettes contenant le master_article :
    - Recettes directes et via sous-recettes
    - Coût par portion, % de coût sur prix de vente, variations
    - Flag is_subrecipe pour filtrage côté front
    """
    return master_article_impact_analysis(
        master_article_id=master_article_id,
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
    )
