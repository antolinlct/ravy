from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Dict, Any, Optional
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
    """Retourne le 1er et le dernier jour du mois pour une date donnée (fallback mois courant)."""
    target_date = target_date or date.today()
    first_day = target_date.replace(day=1)
    next_month = first_day + relativedelta(months=1)
    last_day = next_month - relativedelta(days=1)
    return first_day, last_day

    # Indications :
    # - Ajouter l'import from datetime import date manquant pour éviter une erreur NameError et valider le format ISO côté service front.
    # - Tracer la période retenue pour synchroniser les graphiques front/market et éviter les bornes incohérentes.
    # Tests robustes :
    # - Vérifier le calcul sur plusieurs mois consécutifs, y compris le passage d'année, et sur des dates explicites fournies par le front.
    # - Simuler un start_date > end_date pour s'assurer que la validation amont bloque les bornes inversées.


def market_article_comparison(
    master_article_id: str,
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Compare les prix d’achat réels (articles utilisateur)
    avec les prix du marché (market_articles) pour un master_article donné.

    Basé sur les relations directes :
    - public.master_articles.market_master_article_id → market.market_master_articles.id
    - public.master_articles.supplier_id → public.suppliers.id
    """

    # --- 1. Gestion des dates ---
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
    market_master_id = master_article.get("market_master_article_id")
    if not market_master_id:
        return {
            "master_article": master_article,
            "error": "Missing market_master_article_id for master_article"
        }

    # --- 3. Articles utilisateur (période) ---
    user_articles_resp = (
        supabase.table("articles")
        .select("id, quantity, unit_price, date, master_article_id, establishment_id")
        .eq("master_article_id", master_article_id)
        .eq("establishment_id", establishment_id)
        .gte("date", str(start_date))
        .lte("date", str(end_date))
        .execute()
    )
    user_articles = user_articles_resp.data or []

    # --- 4. Market master article lié directement ---
    market_master_resp = (
        supabase.schema("market").table("market_master_articles")
        .select("id, name, unformatted_name, unit, current_unit_price")
        .eq("id", market_master_id)
        .limit(1)
        .execute()
    )
    if not market_master_resp.data:
        return {
            "master_article": master_article,
            "error": "No market data found for linked market_master_article_id"
        }

    market_master_article = market_master_resp.data[0]

    # --- 5. Market articles sur la période ---
    market_articles_resp = (
        supabase.schema("market").table("market_articles")
        .select("id, unit_price, date, market_master_article_id")
        .eq("market_master_article_id", market_master_id)
        .gte("date", str(start_date))
        .lte("date", str(end_date))
        .execute()
    )
    market_articles = market_articles_resp.data or []

    # --- 6. Stats utilisateur ---
    user_prices = [
        _to_decimal(a.get("unit_price"))
        for a in user_articles
        if a.get("unit_price") is not None
    ]
    user_qtys = [
        _to_decimal(a.get("quantity"))
        for a in user_articles
        if a.get("quantity") is not None
    ]
    user_avg_price = (
        _quantize(sum(user_prices) / len(user_prices)) if user_prices else 0.0
    )
    user_total_qty = _quantize(sum(user_qtys)) if user_qtys else 0.0

    # --- 7. Stats marché ---
    market_prices = [
        _to_decimal(a.get("unit_price"))
        for a in market_articles
        if a.get("unit_price") is not None
    ]
    market_avg_price = (
        _quantize(sum(market_prices) / len(market_prices)) if market_prices else 0.0
    )
    market_min_price = _quantize(min(market_prices)) if market_prices else None
    market_max_price = _quantize(max(market_prices)) if market_prices else None
    market_count = len(market_prices)

    # --- 8. Comparaison et économies ---
    diff_avg_price = (
        _quantize(Decimal(str(user_avg_price)) - Decimal(str(market_avg_price)))
        if market_avg_price
        else None
    )
    potential_savings = (
        float(
            (
                (Decimal(str(user_avg_price)) - Decimal(str(market_avg_price)))
                * Decimal(str(user_total_qty))
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        )
        if market_avg_price and user_total_qty
        else 0
    )

    # --- 9. Fournisseur (toujours présent) ---
    supplier_resp = (
        supabase.table("suppliers")
        .select("id, name, label_id")
        .eq("id", master_article["supplier_id"])
        .eq("establishment_id", establishment_id)
        .limit(1)
        .execute()
    )
    supplier = supplier_resp.data[0] if supplier_resp.data else None

    # --- 10. Résultat final ---
    return {
        "master_article": master_article,
        "market_master_article": market_master_article,
        "stats_user": {
            "avg_price": user_avg_price,
            "total_qty": user_total_qty,
            "supplier": supplier,
        },
        "stats_market": {
            "avg_price": market_avg_price,
            "min_price": market_min_price,
            "max_price": market_max_price,
            "count": market_count,
        },
        "comparison": {
            "diff_avg_price": diff_avg_price,
            "potential_savings": potential_savings,
        },
        "articles": user_articles,
        "market_articles": market_articles,
        "filters": {
            "start_date": str(start_date),
            "end_date": str(end_date),
            "establishment_id": establishment_id,
        },
    }
