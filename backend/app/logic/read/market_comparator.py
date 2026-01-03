from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Dict, Any, Optional
from collections import defaultdict
from dateutil.relativedelta import relativedelta
from app.core.supabase_client import supabase


def _to_decimal(value: Any) -> Optional[Decimal]:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _quantize(value: Optional[Decimal], exp: str = "0.001") -> float:
    if value is None:
        return 0.0
    return float(value.quantize(Decimal(exp), rounding=ROUND_HALF_UP))


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
            supabase.schema("market").table("market_articles")
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

    # Normaliser l'ordre chronologique et filtrer les prix non numériques
    rows = [r for r in rows if r.get("date")]
    rows.sort(key=lambda r: r.get("date"))
    price_rows = []
    for r in rows:
        price = _to_decimal(r.get("unit_price"))
        if price is None:
            continue
        price_rows.append({**r, "unit_price": price})

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
    for r in price_rows:
        grouped[r["date"]].append(r["unit_price"])

    series_daily = [
        {"date": d, "avg_unit_price": _quantize(sum(v) / len(v))}
        for d, v in sorted(grouped.items())
    ]

    if not price_rows:
        return {
            "series_daily": series_daily,
            "stats": {
                "avg_unit_price": 0,
                "min_unit_price": None,
                "max_unit_price": None,
                "last_unit_price": None,
                "last_purchase_date": rows[-1]["date"] if rows else None,
                "count_purchases": len(rows),
                "volatility_range": None,
            },
        }

    prices = [r["unit_price"] for r in price_rows]
    avg_price = _quantize(sum(prices) / len(prices))
    min_price = _quantize(min(prices))
    max_price = _quantize(max(prices))
    last_entry = price_rows[-1]
    last_price = _quantize(last_entry["unit_price"])
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
        supabase.schema("market").table("market_master_articles")
        .select("*")
        .eq("id", market_master_article_1_id)
        .limit(1)
        .execute()
    )
    product1_meta = product1_meta.data[0] if product1_meta.data else None

    product2_meta = (
        supabase.schema("market").table("market_master_articles")
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
    avg1 = Decimal(str(product1_data["stats"]["avg_unit_price"] or 0))
    avg2 = Decimal(str(product2_data["stats"]["avg_unit_price"] or 0))

    diff_avg_eur = _quantize(avg2 - avg1)
    diff_avg_pct = (
        float(((avg2 - avg1) / avg1 * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        if avg1
        else None
    )

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
