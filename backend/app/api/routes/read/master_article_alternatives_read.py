from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query
from app.logic.read.master_article_alternatives import master_article_alternatives

router = APIRouter(
    prefix="/master-articles",
    tags=["Master Articles - Alternatives"]
)


@router.get("/{master_article_id}/alternatives", response_model=Dict[str, Any])
def get_master_article_alternatives(
    master_article_id: str,
    establishment_id: str,
    score_min: Optional[int] = Query(50, description="Score minimal de similarité (0-100)"),
    limit: Optional[int] = Query(50, description="Nombre maximum de résultats retournés"),
    supplier_labels: Optional[List[str]] = Query(
        None,
        description="Filtrer par labels de fournisseurs (ex: FOOD, BEVERAGES, FIXED_COSTS)"
    ),
    supplier_filter_id: Optional[str] = Query(
        None,
        description="Filtrer uniquement par un fournisseur spécifique (supplier_id)"
    ),
):
    """
    Trouve des produits alternatifs à un master_article donné.
    - Recherche de similarité via RapidFuzz (nom nettoyé)
    - Filtrage optionnel par labels fournisseurs (ENUM : FOOD, BEVERAGES, etc.)
    - Filtrage optionnel par fournisseur précis (supplier_id)
    - Renvoie toutes les informations du fournisseur pour chaque alternative
    """
    return master_article_alternatives(
        master_article_id=master_article_id,
        establishment_id=establishment_id,
        score_min=score_min,
        limit=limit,
        supplier_labels=supplier_labels,
        supplier_filter_id=supplier_filter_id,
    )
