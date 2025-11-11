from typing import Dict, Any, Optional, List
from datetime import date
from fastapi import APIRouter, Query
from app.logic.read.invoices_logic import invoices_sum

router = APIRouter(prefix="/invoices", tags=["Invoices - Logic"])

@router.get("/sum", response_model=Dict[str, Any])
def read_invoices_sum(
    establishment_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    supplier_ids: Optional[List[str]] = Query(None),
    supplier_labels: Optional[List[str]] = Query(None),
):
    """
    Retourne la somme des factures d’un établissement sur une période donnée :
    - Sommes totales HT, TVA, TTC
    - Liste des factures correspondantes
    - Filtres appliqués (fournisseurs, labels ENUM)
    """
    return invoices_sum(
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
        supplier_ids=supplier_ids,
        supplier_labels=supplier_labels,
    )
