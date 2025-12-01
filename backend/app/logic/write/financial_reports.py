"""Création ou mise à jour des rapports financiers mensuels.

Le module construit les entrées ``financial_reports`` ainsi que les
``financial_recipes`` et ``financial_ingredients`` associés conformément aux
règles métier décrites dans le cahier des charges. Pour un couple
``(establishment_id, target_month)``, la fonction est idempotente : elle met à
jour les lignes existantes et insère uniquement celles qui manquent.
"""

from __future__ import annotations

from calendar import monthrange
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from statistics import mean
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple, Set
from uuid import UUID

from app.services import (
    articles_service,
    financial_ingredients_service,
    financial_recipes_service,
    financial_reports_service,
    history_ingredients_service,
    ingredients_service,
    invoices_service,
    market_articles_service,
    master_articles_service,
    recipes_service,
    score_matrix_service,
    suppliers_service,
)

from app.logic.write.live_score import create_or_update_live_score


class FinancialReportError(Exception):
    """Dedicated error for financial report write logic."""


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


def _month_bounds(target: date) -> Tuple[date, date]:
    month_start = target.replace(day=1)
    last_day = monthrange(target.year, target.month)[1]
    month_end = target.replace(day=last_day)
    return month_start, month_end


def _previous_month_bounds(target: date) -> Tuple[date, date]:
    first = target.replace(day=1)
    prev_last = first - timedelta(days=1)
    prev_start = prev_last.replace(day=1)
    return prev_start, prev_last


def _mean_or_none(values: Iterable[float | None]) -> Optional[float]:
    cleaned = [v for v in values if v is not None]
    if not cleaned:
        return None
    return float(mean(cleaned))


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


@dataclass
class IngredientAverages:
    unit_cost_per_portion_recipe: Optional[float]
    loss_value: Optional[float]


@dataclass
class MarketAverages:
    article_unit_price: Optional[float]
    market_unit_price: Optional[float]


# ---------------------------------------------------------------------------
# Data fetchers
# ---------------------------------------------------------------------------


def _fetch_history_ingredient_averages(
    *, ingredient_id: UUID, start: date, end: date
) -> IngredientAverages:
    def _fetch_range(start_date: date, end_date: date) -> List[Any]:
        return _paginate(
            history_ingredients_service.get_all_history_ingredients,
            filters={
                "ingredient_id": ingredient_id,
                "date_gte": start_date.isoformat(),
                "date_lte": end_date.isoformat(),
            },
        )

    records = _fetch_range(start, end)
    if not records:
        prev_start, prev_end = _previous_month_bounds(start)
        records = _fetch_range(prev_start, end)

    if not records:
        records = _paginate(
            history_ingredients_service.get_all_history_ingredients,
            filters={"ingredient_id": ingredient_id, "order_by": "date", "direction": "desc"},
            page_size=1,
        )

    ucpp = _mean_or_none(_safe_get(r, "unit_cost_per_portion_recipe", None) for r in records)
    loss_val = _mean_or_none(_safe_get(r, "loss_value", None) for r in records)
    return IngredientAverages(unit_cost_per_portion_recipe=ucpp, loss_value=loss_val)


def _fetch_market_averages(
    *, master_article_id: Optional[UUID], market_master_article_id: Optional[UUID], start: date, end: date
) -> MarketAverages:
    if not master_article_id:
        return MarketAverages(article_unit_price=None, market_unit_price=None)

    def _fetch_articles_range(start_date: date, end_date: date) -> List[Any]:
        return _paginate(
            articles_service.get_all_articles,
            filters={
                "master_article_id": master_article_id,
                "date_gte": start_date.isoformat(),
                "date_lte": end_date.isoformat(),
            },
        )

    def _fetch_market_range(start_date: date, end_date: date) -> List[Any]:
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

    articles_month = _fetch_articles_range(start, end)
    market_month = _fetch_market_range(start, end)

    if not articles_month or not market_month:
        prev_start, prev_end = _previous_month_bounds(start)
        if not articles_month:
            articles_month = _fetch_articles_range(prev_start, end)
        if not market_month:
            market_month = _fetch_market_range(prev_start, end)

    if not articles_month:
        articles_month = _paginate(
            articles_service.get_all_articles,
            filters={
                "master_article_id": master_article_id,
                "order_by": "date",
                "direction": "desc",
            },
            page_size=1,
        )

    if not market_month:
        market_month = _paginate(
            market_articles_service.get_all_market_articles,
            filters={
                "market_master_article_id": market_master_article_id,
                "order_by": "date",
                "direction": "desc",
            },
            page_size=1,
        )

    article_avg = _mean_or_none(_safe_get(a, "unit_price", None) for a in articles_month)
    market_avg = _mean_or_none(_safe_get(m, "unit_price", None) for m in market_month)
    return MarketAverages(article_unit_price=article_avg, market_unit_price=market_avg)

def _collect_flat_ingredients_for_recipe(
    *,
    recipe_id: UUID,
    factor: Decimal,
    results: List[Dict[str, Any]],
    visited: Optional[Set[UUID]] = None,
) -> None:
    """
    Construit une liste plate d'ingrédients ARTICLE pour une recette donnée,
    en expandant récursivement les SUBRECIPES.

    Chaque entrée ajoutée dans `results` a la forme :
    {
        "ingredient_id": UUID,
        "master_article_id": UUID | None,
        "quantity_per_portion": Decimal,  # quantité pour 1 portion de la recette racine
    }

    `factor` accumule le produit des (quantité / portion) le long du chemin.
    """
    if visited is None:
        visited = set()
    if recipe_id in visited:
        return
    visited.add(recipe_id)

    recipe = recipes_service.get_recipes_by_id(recipe_id)
    if not recipe:
        return

    portion_current = _as_decimal(_safe_get(recipe, "portion", 1) or 1) or Decimal("1")

    ingredients = _paginate(
        ingredients_service.get_all_ingredients,
        filters={"recipe_id": recipe_id},
    )

    for ingredient in ingredients:
        ing_type = _safe_get(ingredient, "type", "ARTICLE")
        qty = _as_decimal(_safe_get(ingredient, "quantity", 0) or 0) or Decimal("0")
        if qty <= 0:
            continue

        if ing_type == "ARTICLE":
            ing_id = _safe_get(ingredient, "id", None)
            if not ing_id:
                continue

            master_article_id = _safe_get(ingredient, "master_article_id", None)
            percentage_loss = _as_decimal(_safe_get(ingredient, "percentage_loss", 0) or 0)
            loss_factor = percentage_loss if percentage_loss and percentage_loss > 0 else Decimal("1")

            base_qty = qty * loss_factor  # quantité pour 1 recette courante
            # quantité ramenée à 1 portion de la recette racine
            quantity_per_portion = (factor * base_qty) / portion_current
            if quantity_per_portion <= 0:
                continue

            results.append(
                {
                    "ingredient_id": ing_id,
                    "master_article_id": master_article_id,
                    "quantity_per_portion": quantity_per_portion,
                }
            )

        elif ing_type == "SUBRECIPES":
            # IMPORTANT : adaptez le nom du champ si besoin (subrecipe_id / subrecipes_id / autre)
            subrecipe_id = _safe_get(ingredient, "subrecipe_id", None)
            if not subrecipe_id:
                continue

            # On propage le facteur : (quantité de la sous-recette / portion de la recette courante)
            child_factor = factor * qty / portion_current

            _collect_flat_ingredients_for_recipe(
                recipe_id=subrecipe_id,
                factor=child_factor,
                results=results,
                visited=visited,
            )

        else:
            # On ignore FIXED ou autres types
            continue


def _get_flat_ingredients_for_recipe(recipe_id: UUID) -> List[Dict[str, Any]]:
    """
    Retourne une liste plate d'ingrédients ARTICLE pour une recette donnée,
    chaque quantité étant exprimée pour 1 portion de la recette racine.
    """
    results: List[Dict[str, Any]] = []
    _collect_flat_ingredients_for_recipe(
        recipe_id=recipe_id,
        factor=Decimal("1"),
        results=results,
        visited=set(),
    )
    return results


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def create_or_update_financial_report(
    *,
    establishment_id: UUID,
    target_month: Any,
    payload: Sequence[Dict[str, Any]],
    fte_count: float,
    fte_cost: float,
    total_fixed_cost: float,
    total_variable_cost: float,
    total_other_cost: float,
    total_revenue_excl_tax: float,
    total_revenue_food_excl_tax: float,
) -> Dict[str, Any]:
    if not establishment_id:
        raise FinancialReportError("establishment_id is required")

    month_date = _as_date(target_month)
    if not month_date:
        raise FinancialReportError("target_month invalide")

    month_start, month_end = _month_bounds(month_date)

    existing_reports = financial_reports_service.get_all_financial_reports(
        filters={"establishment_id": establishment_id, "month": month_start.isoformat()},
        limit=1,
    )
    report = existing_reports[0] if existing_reports else None

    if report:
        report_id = _safe_get(report, "id", None)
    else:
        created = financial_reports_service.create_financial_reports(
            {"establishment_id": establishment_id, "month": month_start.isoformat()}
        )
        report_id = created.get("id") if created else None

    if not report_id:
        raise FinancialReportError("Impossible de créer ou récupérer le rapport financier")

    # Nettoyage systématique des données existantes du rapport (financial_recipes & financial_ingredient)
    existing_ingredients = _paginate(
        financial_ingredients_service.get_all_financial_ingredients,
        filters={"financial_report_id": report_id},
    )
    for ingredient in existing_ingredients:
        fi_id = _safe_get(ingredient, "id", None)
        if fi_id is not None:
            financial_ingredients_service.delete_financial_ingredients(fi_id)

    existing_recipes = _paginate(
        financial_recipes_service.get_all_financial_recipes,
        filters={"financial_report_id": report_id},
    )
    for recipe in existing_recipes:
        fr_id = _safe_get(recipe, "id", None)
        if fr_id is not None:
            financial_recipes_service.delete_financial_recipes(fr_id)

    # ------------------------------------------------------------------
    # Étape 1: financial_recipes
    # ------------------------------------------------------------------
    financial_recipes: List[Dict[str, Any]] = []
    theoretical_sales_solid = Decimal("0")
    theoretical_material_cost_solid = Decimal("0")
    total_sales_numbers = Decimal("0")
    balanced_margin_sum = Decimal("0")
    total_revenue_sum = Decimal("0")

    for entry in payload:
        recipe_id = entry.get("id") or entry.get("recipe_id")
        sales_number = _as_decimal(entry.get("sales_number") or 0) or Decimal("0")
        if not recipe_id:
            continue

        recipe = recipes_service.get_recipes_by_id(recipe_id)
        if not recipe:
            continue

        price_excl_tax = _as_decimal(_safe_get(recipe, "price_excl_tax", 0) or 0) or Decimal("0")
        purchase_cost_per_portion = _as_decimal(
            _safe_get(recipe, "purchase_cost_per_portion", 0) or 0
        ) or Decimal("0")
        current_margin = _as_decimal(_safe_get(recipe, "current_margin", 0) or 0) or Decimal("0")
        portion = _as_decimal(_safe_get(recipe, "portion", 1) or 1) or Decimal("1")

        total_revenue_recipe = price_excl_tax * sales_number
        total_cost_recipe = purchase_cost_per_portion * sales_number
        total_margin_recipe = total_revenue_recipe - total_cost_recipe
        balanced_margin = total_revenue_recipe * current_margin

        payload_recipe = {
            "financial_report_id": report_id,
            "recipe_id": recipe_id,
            "sales_number": sales_number,
            "total_revenue": total_revenue_recipe,
            "total_cost": total_cost_recipe,
            "total_margin": total_margin_recipe,
            "establishment_id": establishment_id,
            "balanced_margin": balanced_margin,
        }

        created_recipe = financial_recipes_service.create_financial_recipes(payload_recipe)
        payload_recipe["id"] = created_recipe.get("id") if created_recipe else None

        payload_recipe["portion"] = portion
        financial_recipes.append(payload_recipe)

        theoretical_sales_solid += total_revenue_recipe
        theoretical_material_cost_solid += total_cost_recipe
        total_sales_numbers += sales_number
        balanced_margin_sum += balanced_margin
        total_revenue_sum += total_revenue_recipe

    # ------------------------------------------------------------------
    # Étape 2: financial_ingredients
    # ------------------------------------------------------------------
    consumed_value_sum = Decimal("0")
    market_balanced_sum = Decimal("0")

    for fr in financial_recipes:
        fr_id = fr.get("id")
        recipe_id = fr.get("recipe_id")
        sales_number = _as_decimal(fr.get("sales_number", 0) or 0) or Decimal("0")

        if not fr_id or not recipe_id or sales_number <= 0:
            continue

        # Liste plate de tous les ARTICLES (directs + via SUBRECIPES),
        # quantités déjà ramenées à "par 1 portion de la recette racine".
        flat_ingredients = _get_flat_ingredients_for_recipe(recipe_id)

        for flat in flat_ingredients:
            ing_id = flat.get("ingredient_id")
            master_article_id = flat.get("master_article_id")
            quantity_per_portion = _as_decimal(flat.get("quantity_per_portion", 0) or 0) or Decimal("0")

            if not ing_id or quantity_per_portion <= 0:
                continue

            # Quantité totale sur le mois pour ce rapport (toutes ventes confondues)
            quantity = quantity_per_portion * sales_number

            history_avg = _fetch_history_ingredient_averages(
                ingredient_id=ing_id,
                start=month_start,
                end=month_end,
            )

            consumed_value_unit = _as_decimal(history_avg.unit_cost_per_portion_recipe or 0) or Decimal("0")
            consumed_value = consumed_value_unit * quantity

            accumulated_loss_unit = _as_decimal(history_avg.loss_value or 0) or Decimal("0")
            # Règle métier : loss_value * nb de ventes (pas * quantity)
            accumulated_loss = accumulated_loss_unit * sales_number

            market_master_article_id = None
            if master_article_id:
                master_article = master_articles_service.get_master_articles_by_id(master_article_id)
                market_master_article_id = _safe_get(master_article, "market_master_article_id", None)

            market_avg = _fetch_market_averages(
                master_article_id=master_article_id,
                market_master_article_id=market_master_article_id,
                start=month_start,
                end=month_end,
            )

            market_gap_value = Decimal("0")
            market_gap_percentage = Decimal("0")
            if market_avg.article_unit_price is not None and market_avg.market_unit_price is not None:
                article_unit_price = _as_decimal(market_avg.article_unit_price) or Decimal("0")
                market_unit_price = _as_decimal(market_avg.market_unit_price) or Decimal("0")
                market_gap_value = article_unit_price - market_unit_price
                if market_unit_price:
                    market_gap_percentage = market_gap_value / market_unit_price

            market_total_savings = market_gap_value * quantity
            market_balanced = consumed_value * market_gap_percentage

            payload_ingredient = {
                "financial_report_id": report_id,
                "master_article_id": master_article_id,
                "establishment_id": establishment_id,
                "financial_recipe_id": fr_id,
                "ingredient_id": ing_id,
                "quantity": quantity,
                "consumed_value": consumed_value,
                "accumulated_loss": accumulated_loss,
                "market_gap_value": market_gap_value,
                "market_gap_percentage": market_gap_percentage,
                "market_total_savings": market_total_savings,
                "market_balanced": market_balanced,
            }

            financial_ingredients_service.create_financial_ingredients(payload_ingredient)

            consumed_value_sum += consumed_value
            market_balanced_sum += market_balanced


    # ------------------------------------------------------------------
    # Étape 3: financial_reports
    # ------------------------------------------------------------------
    ca_solid_ht = _as_decimal(total_revenue_food_excl_tax) or Decimal("0")
    ca_total_ht = _as_decimal(total_revenue_excl_tax) or Decimal("0")
    ca_liquid_ht = ca_total_ht - ca_solid_ht

    ca_tracked_recipe_total = theoretical_sales_solid
    ca_tracked_recipe_ratio = (ca_tracked_recipe_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")
    ca_untracked_recipes_total = ca_solid_ht - ca_tracked_recipe_total
    ca_untracked_recipes_ratio = (ca_untracked_recipes_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    suppliers = _paginate(
        suppliers_service.get_all_suppliers,
        filters={"establishment_id": establishment_id},
    )
    supplier_labels = {_safe_get(s, "id", None): _safe_get(s, "label", None) for s in suppliers}

    invoices = _paginate(
        invoices_service.get_all_invoices,
        filters={
            "establishment_id": establishment_id,
            "date_gte": month_start.isoformat(),
            "date_lte": month_end.isoformat(),
        },
    )

    def _sum_invoices(label: str) -> Decimal:
        return sum(
            _as_decimal(_safe_get(inv, "total_excl_tax", 0) or 0) or Decimal("0")
            for inv in invoices
            if supplier_labels.get(_safe_get(inv, "supplier_id", None)) == label
        )

    material_cost_solid = _sum_invoices("FOOD")
    material_cost_liquid = _sum_invoices("BEVERAGES")
    material_cost_total = material_cost_solid + material_cost_liquid

    material_cost_ratio = (material_cost_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")
    material_cost_ratio_solid = (material_cost_solid / ca_total_ht * 100) if ca_total_ht else Decimal("0")
    material_cost_ratio_liquid = (material_cost_liquid / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    labor_cost_total = _as_decimal(fte_cost) or Decimal("0")
    labor_cost_ratio = (labor_cost_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    fixed_charges_total = _sum_invoices("FIXED COSTS") + (_as_decimal(total_fixed_cost) or Decimal("0"))
    fixed_charges_ratio = (fixed_charges_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    variable_charges_total = _sum_invoices("VARIABLES COSTS") + (
        _as_decimal(total_variable_cost) or Decimal("0")
    )
    variable_charges_ratio = (variable_charges_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    other_charges_total = _as_decimal(total_other_cost) or Decimal("0")
    other_charges_ratio = (other_charges_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    commercial_margin_solid = ca_solid_ht - material_cost_solid
    commercial_margin_liquid = ca_liquid_ht - material_cost_liquid
    commercial_margin_total = ca_total_ht - material_cost_total
    commercial_margin_ratio = (commercial_margin_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")
    commercial_margin_solid_ratio = (commercial_margin_solid / ca_total_ht * 100) if ca_total_ht else Decimal("0")
    commercial_margin_liquid_ratio = (
        (commercial_margin_liquid / ca_total_ht * 100) if ca_total_ht else Decimal("0")
    )

    production_cost_total = material_cost_total + labor_cost_total
    production_cost_ratio = (production_cost_total / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    ebitda = ca_total_ht - (
        production_cost_total + fixed_charges_total + variable_charges_total + other_charges_total
    )
    ebitda_ratio = (ebitda / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    mscv = ca_total_ht - (material_cost_total + variable_charges_total)
    mscv_ratio = (mscv / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    break_even_point = (labor_cost_total + fixed_charges_total) / mscv if mscv else Decimal("0")
    safety_margin = ca_total_ht - break_even_point
    safety_margin_ratio = (safety_margin / ca_total_ht * 100) if ca_total_ht else Decimal("0")

    fte_count_decimal = _as_decimal(fte_count) or Decimal("0")
    revenue_per_employee = ca_total_ht / fte_count_decimal if fte_count_decimal else Decimal("0")
    result_per_employee = ebitda / fte_count_decimal if fte_count_decimal else Decimal("0")
    salary_per_employee = labor_cost_total / fte_count_decimal if fte_count_decimal else Decimal("0")

    avg_revenue_per_dish = ca_solid_ht / total_sales_numbers if total_sales_numbers else Decimal("0")
    avg_cost_per_dish = material_cost_solid / total_sales_numbers if total_sales_numbers else Decimal("0")
    avg_margin_per_dish = avg_revenue_per_dish - avg_cost_per_dish

    multiplier_global = ca_total_ht / material_cost_total if material_cost_total else Decimal("0")
    multiplier_solid = ca_solid_ht / material_cost_solid if material_cost_solid else Decimal("0")
    multiplier_liquid = ca_liquid_ht / material_cost_liquid if material_cost_liquid else Decimal("0")

    # Scores
    purchase = (market_balanced_sum / consumed_value_sum * 100) if consumed_value_sum else Decimal("0")
    recipe_score_value = (balanced_margin_sum / total_revenue_sum) if total_revenue_sum else Decimal("0")

    score_matrix = _paginate(
        score_matrix_service.get_all_score_matrix,
        filters={"order_by": "score", "direction": "desc"},
    )

    def _score_from_matrix(field: str, result_value: float) -> float:
        for row in score_matrix:
            threshold = _safe_get(row, field, None)
            score = _safe_get(row, "score", None)
            if threshold is None or score is None:
                continue
            if result_value >= threshold:
                return float(score)
        return float(_safe_get(score_matrix[-1], "score", 0)) if score_matrix else 0

    score_purchase_raw = _score_from_matrix("purchase_result", float(purchase))
    score_purchase = _as_decimal(score_purchase_raw) or Decimal("0")
    score_recipe = _as_decimal(
        round(float((recipe_score_value + score_purchase) / Decimal("2")))
    ) or Decimal("0")
    score_financial_raw = _score_from_matrix("financial_result", float(ebitda_ratio))
    score_financial = _as_decimal(score_financial_raw) or Decimal("0")
    score_global = _as_decimal(
        (score_purchase * Decimal("0.4"))
        + (score_recipe * Decimal("0.4"))
        + (score_financial * Decimal("0.2"))
    ) or Decimal("0")

    update_payload = {
        "establishment_id": establishment_id,
        "month": month_start.isoformat(),
        "ca_solid_ht": ca_solid_ht,
        "ca_liquid_ht": ca_liquid_ht,
        "ca_total_ht": ca_total_ht,
        "ca_tracked_recipes_total": ca_tracked_recipe_total,
        "ca_tracked_recipes_ratio": ca_tracked_recipe_ratio,
        "ca_untracked_recipes_total": ca_untracked_recipes_total,
        "ca_untracked_recipes_ratio": ca_untracked_recipes_ratio,
        "material_cost_solid": material_cost_solid,
        "material_cost_liquid": material_cost_liquid,
        "material_cost_total": material_cost_total,
        "material_cost_ratio": material_cost_ratio,
        "material_cost_ratio_solid": material_cost_ratio_solid,
        "material_cost_ratio_liquid": material_cost_ratio_liquid,
        "labor_cost_total": labor_cost_total,
        "labor_cost_ratio": labor_cost_ratio,
        "fte_count": fte_count_decimal,
        "fixed_charges_total": fixed_charges_total,
        "fixed_charges_ratio": fixed_charges_ratio,
        "variable_charges_total": variable_charges_total,
        "variable_charges_ratio": variable_charges_ratio,
        "other_charges_total": other_charges_total,
        "other_charges_ratio": other_charges_ratio,
        "commercial_margin_solid": commercial_margin_solid,
        "commercial_margin_liquid": commercial_margin_liquid,
        "commercial_margin_total": commercial_margin_total,
        "commercial_margin_solid_ratio": commercial_margin_solid_ratio,
        "commercial_margin_liquid_ratio": commercial_margin_liquid_ratio,
        "commercial_margin_total_ratio": commercial_margin_ratio,
        "production_cost_total": production_cost_total,
        "production_cost_ratio": production_cost_ratio,
        "ebitda": ebitda,
        "ebitda_ratio": ebitda_ratio,
        "mscv": mscv,
        "mscv_ratio": mscv_ratio,
        "break_even_point": break_even_point,
        "safety_margin": safety_margin,
        "safety_margin_ratio": safety_margin_ratio,
        "revenue_per_employee": revenue_per_employee,
        "result_per_employee": result_per_employee,
        "salary_per_employee": salary_per_employee,
        "avg_revenue_per_dish": avg_revenue_per_dish,
        "avg_cost_per_dish": avg_cost_per_dish,
        "avg_margin_per_dish": avg_margin_per_dish,
        "theoretical_sales_solid": theoretical_sales_solid,
        "theoretical_material_cost_solid": theoretical_material_cost_solid,
        "multiplier_global": multiplier_global,
        "multiplier_solid": multiplier_solid,
        "multiplier_liquid": multiplier_liquid,
        "score_global": score_global,
        "score_financial": score_financial,
        "score_recipe": score_recipe,
        "score_purchase": score_purchase,
    }

    financial_reports_service.update_financial_reports(report_id, update_payload)

    # ------------------------------------------------------------------
    # Déclenchement de la mise à jour des live_scores
    # ------------------------------------------------------------------

    # On récupère le rapport financier le plus récent pour cet établissement
    latest_reports = _paginate(
        financial_reports_service.get_all_financial_reports,
        filters={"establishment_id": establishment_id, "order_by": "month", "direction": "desc"},
        page_size=1,
    )

    if latest_reports:
        latest = latest_reports[0]
        latest_month = _as_date(_safe_get(latest, "month", None))
        current_report_month = _as_date(_safe_get(update_payload, "month", None))

        # Si le rapport qu’on vient de traiter est le plus récent -> on déclenche live_score
        if latest_month and current_report_month and latest_month == current_report_month:
            create_or_update_live_score(establishment_id=establishment_id)


    return {"id": report_id, **update_payload}