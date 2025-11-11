from __future__ import annotations
from datetime import date
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
from dateutil.relativedelta import relativedelta

from app.core.supabase_client import supabase


# =============================
# Period helpers
# =============================

def _period_last_months(months: int, today: Optional[date] = None) -> Tuple[date, date]:
    today = today or date.today()
    # Début = 1er jour du mois, (months-1) mois en arrière
    start = (today.replace(day=1) - relativedelta(months=months - 1)).replace(day=1)
    # Fin = dernier jour du mois courant
    next_month = today.replace(day=1) + relativedelta(months=1)
    end = next_month - relativedelta(days=1)
    return start, end


def _ensure_period(
    start_date: Optional[date],
    end_date: Optional[date],
    period_range: Optional[int] = 3,
) -> Tuple[date, date]:
    """
    Si des dates sont fournies → priorité à ces dates.
    Sinon → fallback sur 3/6/12 derniers mois (défaut 3).
    """
    if start_date and end_date:
        return start_date, end_date
    months = period_range if period_range in (3, 6, 12) else 3
    return _period_last_months(months)


# =============================
# Fetchers
# =============================

def _fetch_market_suppliers(supplier_id: Optional[str]) -> List[Dict[str, Any]]:
    q = supabase.table("market_suppliers").select("*")
    if supplier_id:
        q = q.eq("id", supplier_id).limit(1)
    res = q.execute()
    return res.data or []


def _fetch_market_articles(
    supplier_id: str,
    product_id: str,
    start: date,
    end: date,
) -> List[Dict[str, Any]]:
    res = (
        supabase.table("market_articles")
        .select("unit_price, date")
        .eq("market_supplier_id", supplier_id)
        .eq("market_master_article_id", product_id)
        .gte("date", str(start))
        .lte("date", str(end))
        .order("date")
        .execute()
    )
    return res.data or []


def _fetch_user_articles_for_product(
    establishment_id: str,
    market_master_article_id: str,
    start: date,
    end: date,
) -> List[Dict[str, Any]]:
    # Master articles utilisateur liés à ce market_master_article
    master_ids_resp = (
        supabase.table("master_articles")
        .select("id")
        .eq("market_master_article_id", market_master_article_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    master_ids = [m["id"] for m in (master_ids_resp.data or [])]
    if not master_ids:
        return []
    res = (
        supabase.table("articles")
        .select("unit_price, date")
        .in_("master_article_id", master_ids)
        .gte("date", str(start))
        .lte("date", str(end))
        .order("date")
        .execute()
    )
    return res.data or []


# =============================
# Metrics helpers
# =============================

def _daily_avg_series(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Série quotidienne moyenne (utile pour un graph lissé, 1 point/jour)."""
    if not rows:
        return []
    by_day: Dict[str, List[float]] = defaultdict(list)
    for r in rows:
        p = r.get("unit_price")
        d = r.get("date")
        if p is None or not d:
            continue
        by_day[d].append(p)
    return [
        {"date": d, "avg_unit_price": round(sum(vals) / len(vals), 3)}
        for d, vals in sorted(by_day.items())
    ]


def _stats_basic(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Moyenne, min, max, dernier prix/date, volume d’achats, plage de volatilité."""
    if not rows:
        return {
            "avg_unit_price": 0,
            "min_unit_price": None,
            "max_unit_price": None,
            "last_unit_price": None,
            "last_purchase_date": None,
            "count_purchases": 0,
            "volatility_range": None,
        }
    prices = [r["unit_price"] for r in rows if r.get("unit_price") is not None]
    if not prices:
        return {
            "avg_unit_price": 0,
            "min_unit_price": None,
            "max_unit_price": None,
            "last_unit_price": None,
            "last_purchase_date": None,
            "count_purchases": len(rows),
            "volatility_range": None,
        }
    avg_price = round(sum(prices) / len(prices), 3)
    min_price = round(min(prices), 3)
    max_price = round(max(prices), 3)
    last_row = rows[-1]
    return {
        "avg_unit_price": avg_price,
        "min_unit_price": min_price,
        "max_unit_price": max_price,
        "last_unit_price": round(last_row["unit_price"], 3),
        "last_purchase_date": last_row["date"],
        "count_purchases": len(rows),
        "volatility_range": f"{min_price}€ → {max_price}€",
    }


def _variation_over_period(rows: List[Dict[str, Any]]) -> Tuple[Optional[float], Optional[float]]:
    """Variation entre le 1er et le dernier enregistrements de la période."""
    if not rows or len(rows) < 2:
        return None, None
    first = rows[0].get("unit_price")
    last = rows[-1].get("unit_price")
    if first is None or last is None:
        return None, None
    diff = round(last - first, 3)
    pct = round(((last - first) / first * 100), 2) if first else None
    return diff, pct


def _market_volatility_index(stats: Dict[str, Any]) -> Optional[float]:
    """(max - min) / avg → indice de volatilité relatif (0 = très stable)."""
    avg_p = stats.get("avg_unit_price") or 0
    min_p = stats.get("min_unit_price")
    max_p = stats.get("max_unit_price")
    if not avg_p or min_p is None or max_p is None:
        return None
    return round((max_p - min_p) / avg_p, 3)


def _trend_label(variation_eur: Optional[float]) -> str:
    if variation_eur is None:
        return "STABLE"
    if variation_eur > 0:
        return "UP"
    if variation_eur < 0:
        return "DOWN"
    return "STABLE"


def _days_since_last(last_date_str: Optional[str]) -> Optional[int]:
    if not last_date_str:
        return None
    try:
        y, m, d = map(int, last_date_str.split("-"))
        return (date.today() - date(y, m, d)).days
    except Exception:
        return None


def _user_vs_market(user_avg: Optional[float], market_avg: Optional[float]) -> Tuple[Optional[float], Optional[float]]:
    """Diff utilisateur vs marché (€, %) – safe contre None/0."""
    if user_avg is None or market_avg in (None, 0):
        return None, None
    diff_eur = round(user_avg - market_avg, 3)
    diff_pct = round(((user_avg - market_avg) / market_avg * 100), 2)
    return diff_eur, diff_pct


def _deal_score(user_vs_market_percent: Optional[float], volatility_index: Optional[float]) -> Optional[float]:
    """Score composite ∈ [0,1] (1 = excellent) basé sur écart relatif et volatilité."""
    if user_vs_market_percent is None or volatility_index is None:
        return None
    vol = max(0.0, min(1.0, float(volatility_index)))
    rel = max(0.0, min(1.0, abs(float(user_vs_market_percent)) / 100.0))
    return round((1 - rel) * (1 - vol), 3)


def _recommendation_badge(
    user_vs_market_percent: Optional[float],
    volatility_index: Optional[float],
    days_since_last: Optional[int],
) -> Optional[str]:
    if user_vs_market_percent is not None and user_vs_market_percent < -5:
        return "Très bon prix"
    if user_vs_market_percent is not None and user_vs_market_percent > 5:
        return "À surveiller"
    if volatility_index is not None and volatility_index > 0.2:
        return "Prix instable"
    if days_since_last is not None and days_since_last > 30:
        return "Données anciennes"
    return None


def _is_good_time_to_buy(series_daily: List[Dict[str, Any]], window_days: int = 14) -> Optional[bool]:
    """
    Heuristique : compare la moyenne des 14 derniers jours à la moyenne globale.
    True  → bon moment (>= 3% moins cher)
    False → mauvais moment (>= 3% plus cher)
    None  → neutre / données insuffisantes
    """
    if not series_daily:
        return None
    prices = [p.get("avg_unit_price") for p in series_daily if p.get("avg_unit_price") is not None]
    if not prices:
        return None
    period_avg = sum(prices) / len(prices)
    tail = prices[-min(window_days, len(prices)):]
    if not tail:
        return None
    tail_avg = sum(tail) / len(tail)
    if period_avg == 0:
        return None
    delta = (tail_avg - period_avg) / period_avg
    if delta <= -0.03:
        return True
    if delta >= 0.03:
        return False
    return None


# =============================
# Main logic
# =============================

def market_database_overview(
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supplier_id: Optional[str] = None,
    include_user_comparison: bool = True,
    period_range: Optional[int] = 3,
) -> Dict[str, Any]:
    """
    Vue agrégée des prix marché par fournisseur → produits.
    - Période fallback: 3, 6 ou 12 derniers mois (`period_range`)
    - Si des dates sont fournies, elles prennent le dessus.
    - Enrichissements: séries journalières, variation, volatilité, tendance, derniers prix,
      comparaison utilisateur (moyenne/dernier/écarts), deal_score, badges, “bon moment”.
    """
    start, end = _ensure_period(start_date, end_date, period_range)

    suppliers = _fetch_market_suppliers(supplier_id)
    if not suppliers:
        return {"period": {"start": str(start), "end": str(end)}, "suppliers": []}

    result_suppliers: List[Dict[str, Any]] = []

    for sup in suppliers:
        sup_id = sup.get("id")

        # Produits (market_master_article_id) avec activité pour ce fournisseur, dans la période
        prod_resp = (
            supabase.table("market_articles")
            .select("market_master_article_id")
            .eq("market_supplier_id", sup_id)
            .gte("date", str(start))
            .lte("date", str(end))
            .execute()
        )
        product_ids = list({
            r["market_master_article_id"]
            for r in (prod_resp.data or [])
            if r.get("market_master_article_id")
        })

        products_block: List[Dict[str, Any]] = []
        if product_ids:
            # Métadonnées produit (en chunks de 500)
            chunks = [product_ids[i:i + 500] for i in range(0, len(product_ids), 500)]
            meta_map: Dict[str, Dict[str, Any]] = {}
            for chunk in chunks:
                mm = (
                    supabase.table("market_master_articles")
                    .select("*")
                    .in_("id", chunk)
                    .execute()
                )
                for row in (mm.data or []):
                    meta_map[row["id"]] = row

            # Boucle par produit
            for product_id in product_ids:
                market_rows = _fetch_market_articles(sup_id, product_id, start, end)
                series_daily = _daily_avg_series(market_rows)
                stats = _stats_basic(market_rows)
                var_eur, var_pct = _variation_over_period(market_rows)
                vol_index = _market_volatility_index(stats)
                trend = _trend_label(var_eur)
                days_last = _days_since_last(stats.get("last_purchase_date"))
                good_time = _is_good_time_to_buy(series_daily)

                user_avg: Optional[float] = None
                user_last: Optional[float] = None
                user_vs_eur: Optional[float] = None
                user_vs_pct: Optional[float] = None
                potential_saving: Optional[float] = None
                user_rows: List[Dict[str, Any]] = []

                if include_user_comparison:
                    user_rows = _fetch_user_articles_for_product(
                        establishment_id=establishment_id,
                        market_master_article_id=product_id,
                        start=start,
                        end=end,
                    )
                    if user_rows:
                        user_prices = [r["unit_price"] for r in user_rows if r.get("unit_price") is not None]
                        if user_prices:
                            user_avg = round(sum(user_prices) / len(user_prices), 3)
                            user_last = round(user_rows[-1]["unit_price"], 3)
                            user_vs_eur, user_vs_pct = _user_vs_market(
                                user_avg,
                                stats.get("avg_unit_price") or 0,
                            )
                            # Économie potentielle simple: si l'utilisateur paye + cher que la moyenne marché
                            if user_vs_eur is not None and user_vs_eur > 0 and len(user_rows) > 0:
                                potential_saving = round(user_vs_eur * len(user_rows), 2)

                deal = _deal_score(user_vs_pct, vol_index)
                badge = _recommendation_badge(user_vs_pct, vol_index, days_last)

                products_block.append({
                    "market_master_article": meta_map.get(product_id),
                    "series_daily": series_daily,
                    "stats": {
                        **stats,
                        "variation_euro": var_eur,
                        "variation_percent": var_pct,
                        "market_volatility_index": vol_index,
                        "trend": trend,
                        "days_since_last": days_last,
                        "is_good_time_to_buy": good_time,
                    },
                    "user": {
                        "has_purchased": bool(user_rows),
                        "user_avg_unit_price": user_avg,
                        "user_last_unit_price": user_last,
                        "user_vs_market_eur": user_vs_eur,
                        "user_vs_market_percent": user_vs_pct,
                        "potential_saving_eur": potential_saving,
                        "deal_score": deal,
                        "recommendation_badge": badge,
                    },
                })

        result_suppliers.append({"market_supplier": sup, "products": products_block})

    return {"period": {"start": str(start), "end": str(end)}, "suppliers": result_suppliers}
