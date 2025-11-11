from datetime import date
from typing import List, Optional, Dict, Any
from dateutil.relativedelta import relativedelta
from app.core.supabase_client import supabase


def get_month_bounds(target_date: Optional[date] = None):
    """Retourne le premier et le dernier jour du mois pour une date donnée (ou aujourd'hui)."""
    target_date = target_date or date.today()
    first_day = target_date.replace(day=1)
    next_month = first_day + relativedelta(months=1)
    last_day = next_month - relativedelta(days=1)
    return first_day, last_day


def invoices_sum(
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supplier_ids: Optional[List[str]] = None,
    supplier_labels: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Calcule les totaux (HT, TVA, TTC) des factures d’un établissement
    sur une période donnée, avec filtres optionnels :
    - par fournisseurs (supplier_ids)
    - par labels de fournisseurs (ENUM : FOOD, BEVERAGES, FIXED_COSTS, etc.)

    Champs conformes aux contrats :
    - public.invoices : total_ht, total_tva, total_ttc
    - public.suppliers : label_id (ENUM label_supplier.label)
    """

    # --- 1. Déterminer la période cible (mois courant si non précisée) ---
    if not start_date or not end_date:
        start_date, end_date = get_month_bounds()

    # --- 2. Construction de la requête principale ---
    query = (
        supabase.table("invoices")
        .select("id, date, supplier_id, total_ht, total_tva, total_ttc, establishment_id")
        .eq("establishment_id", establishment_id)
        .gte("date", str(start_date))
        .lte("date", str(end_date))
    )

    # --- 3. Filtrage direct par fournisseurs spécifiques ---
    if supplier_ids:
        query = query.in_("supplier_id", supplier_ids)

    # --- 4. Filtrage par labels ENUM de fournisseurs ---
    if supplier_labels:
        # Récupère les fournisseurs ayant ces labels ENUM
        suppliers_response = (
            supabase.table("suppliers")
            .select("id, label_id")
            .eq("establishment_id", establishment_id)
            .in_("label_id", supplier_labels)  # ENUM direct
            .execute()
        )
        supplier_ids_from_labels = [s["id"] for s in suppliers_response.data] if suppliers_response.data else []
        if supplier_ids_from_labels:
            query = query.in_("supplier_id", supplier_ids_from_labels)

    # --- 5. Exécution principale ---
    result = query.execute()
    invoices = result.data or []

    # --- 6. Calculs totaux sécurisés ---
    sum_ht = sum(inv.get("total_ht", 0) or 0 for inv in invoices)
    sum_tva = sum(inv.get("total_tva", 0) or 0 for inv in invoices)
    sum_ttc = sum(inv.get("total_ttc", 0) or 0 for inv in invoices)

    # --- 7. Résultat final ---
    return {
        "filters": {
            "establishment_id": establishment_id,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "supplier_ids": supplier_ids or [],
            "supplier_labels": supplier_labels or [],
        },
        "totals": {
            "sum_ht": round(sum_ht, 2),
            "sum_tva": round(sum_tva, 2),
            "sum_ttc": round(sum_ttc, 2),
        },
        "count": len(invoices),
        "invoices": invoices,
    }
