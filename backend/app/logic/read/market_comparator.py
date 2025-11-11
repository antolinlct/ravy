from datetime import date
from typing import Dict, Any, Optional
from collections import defaultdict
from dateutil.relativedelta import relativedelta
from app.core.supabase_client import supabase


def get_month_bounds(target_date: Optional[date] = None):
    """Retourne le 1er et le dernier jour du mois courant (fallback)."""
    target_date = target_date or date.today()
    first_day = target_date.replace(day=1)
    next_month = first_day + relativedelta(months=1)
    last_day = next_month - relativedelta(days=1)
    return first_day, last_day


def _fetch_product_data(
    market_master_article_id: str,
    establishment_id: str,
    start_date: date,
    end_date: date,
    only_my_invoices: bool = False,
) -> Dict[str, Any]:
    """
    Récupère les données marché ou personnelles pour un produit donné.
    - Si only_my_invoices=False → market_articles (marché global)
    - Si only_my_invoices=True  → articles utilisateur via master_articles liés
    """

    if not only_my_invoices:
        # --- Données marché global ---
        resp = (
            supabase.table("market_articles")
            .select("unit_price, date")
            .eq("market_master_article_id", market_master_article_id)
            .gte("date", str(start_date))
            .lte("date", str(end_date))
            .order("date")
            .execute()
        )
        rows = resp.data or []
    else:
        # --- Données personnelles (seulement mes factures) ---
        master_resp = (
            supabase.table("master_articles")
            .select("id")
            .eq("market_master_article_id", market_master_article_id)
            .eq("establishment_id", establishment_id)
            .execute()
        )
        master_ids = [m["id"] for m in master_resp.data or []]

        if not master_ids:
            rows = []
        else:
            resp = (
                supabase.table("articles")
                .select("unit_price, date")
                .in_("master_article_id", master_ids)
                .gte("date", str(start_date))
                .lte("date", str(end_date))
                .order("date")
                .execute()
            )
            rows = resp.data or []

    if not rows:
        return {
            "series_daily": [],
            "stats": {
                "avg_unit_price": 0,
                "min_unit_price": None,
                "max_unit_price": None,
                "last_unit_price": None,
                "last_purchase_date": None,
                "count_purchases": 0,
                "volatility_range": None,
            },
        }

    # --- Agrégation journalière ---
    grouped = defaultdict(list)
    for r in rows:
        grouped[r["date"]].append(r["unit_price"])

    series_daily = [
        {"date": d, "avg_unit_price": round(sum(v) / len(v), 3)}
        for d, v in sorted(grouped.items())
    ]

    prices = [r["unit_price"] for r in rows if r.get("unit_price") is not None]
    if not prices:
        return {
            "series_daily": series_daily,
            "stats": {
                "avg_unit_price": 0,
                "min_unit_price": None,
                "max_unit_price": None,
                "last_unit_price": None,
                "last_purchase_date": None,
                "count_purchases": len(rows),
                "volatility_range": None,
            },
        }

    avg_price = round(sum(prices) / len(prices), 3)
    min_price = round(min(prices), 3)
    max_price = round(max(prices), 3)
    last_entry = rows[-1]
    last_price = round(last_entry["unit_price"], 3)
    last_date = last_entry["date"]

    return {
        "series_daily": series_daily,
        "stats": {
            "avg_unit_price": avg_price,
            "min_unit_price": min_price,
            "max_unit_price": max_price,
            "last_unit_price": last_price,
            "last_purchase_date": last_date,
            "count_purchases": len(rows),
            "volatility_range": f"{min_price}€ → {max_price}€",
        },
    }


def market_comparator(
    market_master_article_1_id: str,
    market_master_article_2_id: str,
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    only_my_invoices_product1: bool = False,
    only_my_invoices_product2: bool = False,
) -> Dict[str, Any]:
    """
    Compare deux produits marché (market_master_articles) entre eux.
    Produit 1 = référence, Produit 2 = comparaison.
    """

    # --- 1. Gestion période ---
    if not start_date or not end_date:
        start_date, end_date = get_month_bounds()

    # --- 2. Métadonnées des market_master_articles ---
    product1_meta = (
        supabase.table("market_master_articles")
        .select("*")
        .eq("id", market_master_article_1_id)
        .limit(1)
        .execute()
    )
    product1_meta = product1_meta.data[0] if product1_meta.data else None

    product2_meta = (
        supabase.table("market_master_articles")
        .select("*")
        .eq("id", market_master_article_2_id)
        .limit(1)
        .execute()
    )
    product2_meta = product2_meta.data[0] if product2_meta.data else None

    # --- 3. Données produit 1 ---
    product1_data = _fetch_product_data(
        market_master_article_id=market_master_article_1_id,
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
        only_my_invoices=only_my_invoices_product1,
    )

    # --- 4. Données produit 2 ---
    product2_data = _fetch_product_data(
        market_master_article_id=market_master_article_2_id,
        establishment_id=establishment_id,
        start_date=start_date,
        end_date=end_date,
        only_my_invoices=only_my_invoices_product2,
    )

    # --- 5. Comparaison directionnelle (Produit 2 vs Produit 1) ---
    avg1 = product1_data["stats"]["avg_unit_price"] or 0
    avg2 = product2_data["stats"]["avg_unit_price"] or 0

    diff_avg_eur = round(avg2 - avg1, 3)
    diff_avg_pct = round(((avg2 - avg1) / avg1 * 100), 2) if avg1 else None

    # --- 6. Résultat final ---
    return {
        "period": {"start": str(start_date), "end": str(end_date)},
        "product1": {
            "meta": product1_meta,
            **product1_data,
        },
        "product2": {
            "meta": product2_meta,
            **product2_data,
        },
        "comparison": {
            "diff_avg_eur": diff_avg_eur,
            "diff_avg_pct": diff_avg_pct,
        },
    }
