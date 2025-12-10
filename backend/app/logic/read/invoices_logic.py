from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import List, Optional, Dict, Any
from dateutil.relativedelta import relativedelta
from app.core.supabase_client import supabase


def _safe_decimal(value: Any) -> Decimal:
    """Convertit en Decimal pour préserver la précision des montants."""
    if isinstance(value, Decimal):
        return value
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal("0")


def get_month_bounds(target_date: Optional[date] = None):
    """Retourne le premier et le dernier jour du mois pour une date donnée (ou aujourd'hui)."""
    target_date = target_date or date.today()
    first_day = target_date.replace(day=1)
    next_month = first_day + relativedelta(months=1)
    last_day = next_month - relativedelta(days=1)
    return first_day, last_day

    # Indications :
    # - Ajouter l'import from datetime import date manquant pour éviter un NameError lors de l'appel depuis les services.
    # - Valider que la date passée est timezone aware et alignée avec la périodicité attendue pour éviter les chevauchements de périodes.
    # - Journaliser les bornes calculées pour les comparer aux exports financiers et prévoir un garde-fou lorsque start_date > end_date.
    # Tests robustes :
    # - Couvrir la génération des bornes sur changement d'année/mois et avec des dates explicites fournies par le front.
    # - Simuler une date naïve vs. timezone pour vérifier l'homogénéité des bornes dans les services consommateurs.


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
    if start_date > end_date:
        raise ValueError("start_date cannot be after end_date")

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
    sum_ht = sum(_safe_decimal(inv.get("total_ht", 0)) for inv in invoices)
    sum_tva = sum(_safe_decimal(inv.get("total_tva", 0)) for inv in invoices)
    sum_ttc = sum(_safe_decimal(inv.get("total_ttc", 0)) for inv in invoices)

    def _quantize(value: Decimal, exp: str = "0.01") -> float:
        return float(value.quantize(Decimal(exp), rounding=ROUND_HALF_UP))

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
            "sum_ht": _quantize(sum_ht),
            "sum_tva": _quantize(sum_tva),
            "sum_ttc": _quantize(sum_ttc),
        },
        "count": len(invoices),
        "invoices": invoices,
    }