"""Création et mise à jour des scores live pour un établissement."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Dict, Iterable, List, Optional, Sequence
from uuid import UUID

from app.services import (
    articles_service,
    financial_ingredients_service,
    financial_recipes_service,
    financial_reports_service,
    live_score_service,
    market_articles_service,
    master_articles_service,
    recipes_service,
    score_matrix_service,
)


class LiveScoreError(Exception):
    """Dedicated error for live score write logic."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _as_date(value: Any) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        try:
            return date.fromisoformat(raw[:10])
        except ValueError:
            return None
    return None


def _as_decimal(value: Any) -> Optional[Decimal]:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return None
        try:
            return Decimal(raw)
        except InvalidOperation:
            return None
    return None


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _paginate(fetcher, *, filters: dict, page_size: int = 500) -> List[Any]:
    results: List[Any] = []
    page = 1
    while True:
        batch = fetcher(filters=filters, limit=page_size, page=page)
        if not batch:
            break
        results.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return results


def _mean_decimal(values: Iterable[Optional[Decimal]]) -> Optional[Decimal]:
    cleaned = [v for v in values if v is not None]
    if not cleaned:
        return None
    return sum(cleaned) / Decimal(len(cleaned))


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def create_or_update_live_score(*, establishment_id: UUID, target_date: Any = None) -> Dict[str, Decimal]:
    if not establishment_id:
        raise LiveScoreError("establishment_id is required")

    today = _as_date(target_date) or date.today()
    today = today.replace(day=today.day)
    base_date = today - timedelta(days=30)

    reports = _paginate(
        financial_reports_service.get_all_financial_reports,
        filters={"establishment_id": establishment_id, "order_by": "month", "direction": "desc"},
        page_size=1,
    )
    if not reports:
        raise LiveScoreError("Aucun rapport financier trouvé pour l'établissement")

    report = reports[0]
    report_id = _safe_get(report, "id", None)
    if not report_id:
        raise LiveScoreError("Le rapport financier sélectionné est invalide")

    report_month = _as_date(_safe_get(report, "month", None))
    ebitda_ratio = _as_decimal(_safe_get(report, "ebitda_ratio", 0) or 0) or Decimal("0")

    ingredients = _paginate(
        financial_ingredients_service.get_all_financial_ingredients,
        filters={"financial_report_id": report_id},
    )
    recipes = _paginate(
        financial_recipes_service.get_all_financial_recipes,
        filters={"financial_report_id": report_id},
    )

    consumed_value_sum = Decimal("0")
    market_balanced_sum = Decimal("0")

    def _fetch_market_averages_range(
        *, master_article_id: Optional[UUID], market_master_article_id: Optional[UUID], start: date, end: date
    ) -> Dict[str, Optional[Decimal]]:
        if not master_article_id:
            return {"article": None, "market": None}

        def _fetch_articles(start_date: date, end_date: date) -> Sequence[Any]:
            return _paginate(
                articles_service.get_all_articles,
                filters={
                    "master_article_id": master_article_id,
                    "date_gte": start_date.isoformat(),
                    "date_lte": end_date.isoformat(),
                },
            )

        def _fetch_market(start_date: date, end_date: date) -> Sequence[Any]:
            if not market_master_article_id:
                return []
            return _paginate(
                market_articles_service.get_all_market_articles,
                filters={
                    "market_master_article_id": market_master_article_id,
                    "date_gte": start_date.isoformat(),
                    "date_lte": end_date.isoformat(),
                },
            )

        articles_range = _fetch_articles(start, end)
        market_range = _fetch_market(start, end)

        if not articles_range or not market_range:
            extended_start = today - timedelta(days=45)
            if not articles_range:
                articles_range = _fetch_articles(extended_start, end)
            if not market_range:
                market_range = _fetch_market(extended_start, end)

        if not articles_range:
            articles_range = _paginate(
                articles_service.get_all_articles,
                filters={"master_article_id": master_article_id, "order_by": "date", "direction": "desc"},
                page_size=1,
            )

        if not market_range:
            market_range = _paginate(
                market_articles_service.get_all_market_articles,
                filters={"market_master_article_id": market_master_article_id, "order_by": "date", "direction": "desc"},
                page_size=1,
            )

        article_avg = _mean_decimal(_as_decimal(_safe_get(a, "unit_price", None)) for a in articles_range)
        market_avg = _mean_decimal(_as_decimal(_safe_get(m, "unit_price", None)) for m in market_range)
        return {"article": article_avg, "market": market_avg}

    for ingredient in ingredients:
        quantity = _as_decimal(_safe_get(ingredient, "quantity", 0) or 0) or Decimal("0")
        consumed_value = _as_decimal(_safe_get(ingredient, "consumed_value", 0) or 0) or Decimal("0")

        master_article_id = _safe_get(ingredient, "master_article_id", None)
        market_master_article_id = None
        if master_article_id:
            master_article = master_articles_service.get_master_articles_by_id(master_article_id)
            market_master_article_id = _safe_get(master_article, "market_master_article_id", None)

        averages = _fetch_market_averages_range(
            master_article_id=master_article_id,
            market_master_article_id=market_master_article_id,
            start=base_date,
            end=today,
        )

        market_gap_value = Decimal("0")
        market_gap_percentage = Decimal("0")
        if averages["article"] is not None and averages["market"] is not None:
            article_unit_price = averages["article"] or Decimal("0")
            market_unit_price = averages["market"] or Decimal("0")
            market_gap_value = article_unit_price - market_unit_price
            if market_unit_price:
                market_gap_percentage = market_gap_value / market_unit_price

        market_total_savings = market_gap_value * quantity
        market_balanced = consumed_value * market_gap_percentage

        consumed_value_sum += consumed_value
        market_balanced_sum += market_balanced

    balanced_margin_sum = Decimal("0")
    total_revenue_sum = Decimal("0")

    for fr in recipes:
        recipe_id = _safe_get(fr, "recipe_id", None)
        total_revenue = _as_decimal(_safe_get(fr, "total_revenue", 0) or 0) or Decimal("0")
        recipe = recipes_service.get_recipes_by_id(recipe_id) if recipe_id else None
        current_margin = _as_decimal(_safe_get(recipe, "current_margin", 0) or 0) or Decimal("0")
        balanced_margin = total_revenue * current_margin
        balanced_margin_sum += balanced_margin
        total_revenue_sum += total_revenue

    purchase = (market_balanced_sum / consumed_value_sum * Decimal("100")) if consumed_value_sum else Decimal("0")
    recipe_score_value = (balanced_margin_sum / total_revenue_sum) if total_revenue_sum else Decimal("0")

    score_matrix = _paginate(
        score_matrix_service.get_all_score_matrix,
        filters={"order_by": "score", "direction": "desc"},
    )

    def _score_from_matrix(field: str, result_value: Decimal) -> Decimal:
        for row in score_matrix:
            threshold = _as_decimal(_safe_get(row, field, None))
            score_value = _as_decimal(_safe_get(row, "score", None))
            if threshold is None or score_value is None:
                continue
            if result_value >= threshold:
                return score_value
        if score_matrix:
            last_score = _as_decimal(_safe_get(score_matrix[-1], "score", 0))
            return last_score if last_score is not None else Decimal("0")
        return Decimal("0")

    score_purchase = _score_from_matrix("purchase_result", purchase)
    score_recipe_base = (recipe_score_value + score_purchase) / Decimal("2")
    score_recipe = score_recipe_base.quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    score_financial = _score_from_matrix("financial_result", ebitda_ratio)
    score_global = (score_purchase * Decimal("0.4")) + (score_recipe * Decimal("0.4")) + (score_financial * Decimal("0.2"))

    if report_month:
        current_month_start = today.replace(day=1)
        previous_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        if report_month != previous_month_start:
            score_purchase -= Decimal("18.18")
            score_recipe -= Decimal("18.18")
            score_financial -= Decimal("9.1")
            score_global -= Decimal("15")
    else:
        score_purchase -= Decimal("18.18")
        score_recipe -= Decimal("18.18")
        score_financial -= Decimal("9.1")
        score_global -= Decimal("15")

    existing_scores = _paginate(
        live_score_service.get_all_live_score,
        filters={"establishment_id": establishment_id},
    )
    by_type = {str(_safe_get(ls, "type", "")): ls for ls in existing_scores}

    def _upsert_score(score_type: str, value: Decimal) -> Optional[Any]:
        existing = by_type.get(score_type)
        payload = {"establishment_id": establishment_id, "type": score_type, "value": value}
        if existing:
            ls_id = _safe_get(existing, "id", None)
            if ls_id is not None:
                return live_score_service.update_live_score(ls_id, payload)
        return live_score_service.create_live_score(payload)

    _upsert_score("purchase", score_purchase)
    _upsert_score("recipe", score_recipe)
    _upsert_score("financial", score_financial)
    _upsert_score("global", score_global)

    return {
        "purchase": score_purchase,
        "recipe": score_recipe,
        "financial": score_financial,
        "global": score_global,
    }

