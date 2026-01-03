from datetime import date
from typing import Dict, Any, Optional
from datetime import date
from typing import Dict, Any, List, Optional
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from dateutil.relativedelta import relativedelta
from app.core.supabase_client import supabase


def _to_decimal(value: Any, default: str = "0") -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(default)


def _quantize(value: Decimal, exp: str = "0.001") -> float:
    return float(value.quantize(Decimal(exp), rounding=ROUND_HALF_UP))


def get_month_bounds(target_date: Optional[date] = None):
    """Retourne le 1er et le dernier jour du mois courant (fallback)."""
    target_date = target_date or date.today()
    first_day = target_date.replace(day=1)
    next_month = first_day + relativedelta(months=1)
    last_day = next_month - relativedelta(days=1)
    return first_day, last_day


def master_article_analysis(
    master_article_id: str,
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Analyse un master_article sur une période donnée :
    - Articles liés sur la période (achats)
    - Statistiques clés : prix moyen, min, max, quantités, total dépensé
    - Moyenne de quantité unitaire
    - Liste des factures correspondantes
    """

    # --- 1. Gestion de la période ---
    if not start_date or not end_date:
        start_date, end_date = get_month_bounds()

    # --- 2. Récupération du master_article ---
    master_resp = (
        supabase.table("master_articles")
        .select("id, unformatted_name, name, supplier_id, establishment_id, market_master_article_id")
        .eq("id", master_article_id)
        .eq("establishment_id", establishment_id)
        .limit(1)
        .execute()
    )
    if not master_resp.data:
        return {"error": "Master article not found", "master_article_id": master_article_id}

    master_article = master_resp.data[0]

    # --- 3. Récupération des articles du master_article ---
    articles_resp = (
        supabase.table("articles")
        .select("id, date, unit_price, quantity, invoice_id, master_article_id, establishment_id")
        .eq("master_article_id", master_article_id)
        .eq("establishment_id", establishment_id)
        .gte("date", str(start_date))
        .lte("date", str(end_date))
        .order("date", desc=True)
        .execute()
    )
    articles = articles_resp.data or []

    # --- 4. Si aucun article ---
    if not articles:
        return {
            "master_article": master_article,
            "stats": {
                "count_articles": 0,
                "avg_unit_price": 0,
                "min_unit_price": None,
                "max_unit_price": None,
                "total_quantity": 0,
                "avg_quantity": 0,
                "total_spent": 0,
                "price_first": None,
                "price_last": None,
            },
            "articles": [],
            "invoices": [],
            "filters": {
                "establishment_id": establishment_id,
                "master_article_id": master_article_id,
                "start_date": str(start_date),
                "end_date": str(end_date),
            },
        }

    # --- 5. Calculs statistiques ---
    prices = [
        _to_decimal(a.get("unit_price"))
        for a in articles
        if a.get("unit_price") is not None
    ]
    quantities = [
        _to_decimal(a.get("quantity"))
        for a in articles
        if a.get("quantity") is not None
    ]

    total_quantity = _quantize(sum(quantities)) if quantities else 0.0
    avg_quantity = _quantize(sum(quantities) / len(quantities)) if quantities else 0.0
    avg_unit_price = _quantize(sum(prices) / len(prices)) if prices else 0.0
    min_price = _quantize(min(prices)) if prices else None
    max_price = _quantize(max(prices)) if prices else None
    total_spent = (
        float((sum(p * q for p, q in zip(prices, quantities))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        if prices and quantities
        else 0
    )

    # --- Évolution prix : premier et dernier article ---
    price_first = _quantize(prices[-1]) if len(prices) > 0 else None
    price_last = _quantize(prices[0]) if len(prices) > 0 else None

    stats = {
        "count_articles": len(articles),
        "avg_unit_price": avg_unit_price,
        "min_unit_price": min_price,
        "max_unit_price": max_price,
        "total_quantity": total_quantity,
        "avg_quantity": avg_quantity,
        "total_spent": total_spent,
        "price_first": price_first,
        "price_last": price_last,
    }

    # --- 6. Factures concernées ---
    invoice_ids = list({a.get("invoice_id") for a in articles if a.get("invoice_id")})
    invoices_resp = (
        supabase.table("invoices")
        .select(
            "id, supplier_id, invoice_number, date, total_excl_tax, total_tax, total_incl_tax, establishment_id"
        )
        .in_("id", invoice_ids)
        .eq("establishment_id", establishment_id)
        .execute()
        if invoice_ids
        else None
    )
    invoices = invoices_resp.data if invoices_resp else []

    # --- 7. Résultat final ---
    return {
        "master_article": master_article,
        "stats": stats,
        "articles": articles,
        "invoices": invoices,
        "filters": {
            "establishment_id": establishment_id,
            "master_article_id": master_article_id,
            "start_date": str(start_date),
            "end_date": str(end_date),
        },
    }
