from typing import Optional, Dict, Any
from datetime import date
from fastapi import APIRouter, Query

from app.logic.read.recipe_ingredients_analysis import recipe_ingredients_analysis

router = APIRouter(
    prefix="/recipes",
    tags=["Recipes - Ingredients Analysis"]
)


@router.get("/{recipe_id}/ingredients-analysis", response_model=Dict[str, Any])
def get_recipe_ingredients_analysis(
    recipe_id: str,
    establishment_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    """
    Analyse détaillée des ingrédients d'une recette :
    - Tous les ingrédients (ARTICLE + SUBRECIPE)
    - Coût par portion, % du coût recette, variation et impact
    - Retourne aussi toutes les données brutes pour affichage complet dans le tableau front
    """
    return recipe_ingredients_analysis(
        recipe_id=recipe_id,
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
    )
