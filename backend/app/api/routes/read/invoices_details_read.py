from typing import Dict, Any
from fastapi import APIRouter
from app.logic.read.invoices_details import get_invoice_detail as logic_get_invoice_detail

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices - Details"]
)

@router.get("/{invoice_id}/details", response_model=Dict[str, Any])
def read_invoice_detail(invoice_id: str):
    """
    Retourne le détail complet d'une facture :
    - Informations de la facture
    - Liste des articles associés
    - Nombre total d'articles
    - Variation des prix unitaires (€/ %)
    """
    return logic_get_invoice_detail(invoice_id)
