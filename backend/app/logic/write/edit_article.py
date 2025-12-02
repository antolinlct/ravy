from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set
from uuid import UUID

from app.logic.write.shared.ingredients_history_ingredients import (
    update_ingredients_and_history_ingredients,
)
from app.logic.write.shared.recipes_average_margins import recompute_recipe_margins
from app.logic.write.shared.recipes_history_recipes import (
    update_recipes_and_history_recipes,
)
from app.services import (
    articles_service,
    history_ingredients_service,
    ingredients_service,
    master_articles_service,
    recipes_service,
)


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE pour l'édition d'articles."""


# ============================================================
# Helpers génériques
# ============================================================


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


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
        except Exception:
            return None
    return None


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


def _decimal_or_zero(value: Optional[Decimal]) -> Decimal:
    return value if value is not None else Decimal("0")


def _paginate_ingredients(
    *, filters: Dict[str, Any], page_size: int = 500
) -> List[Any]:
    page = 1
    collected: List[Any] = []
    while True:
        batch = ingredients_service.get_all_ingredients(
            filters=filters, limit=page_size, page=page
        )
        if not batch:
            break
        collected.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return collected


def _ensure_portion(recipe_id: Optional[UUID]) -> Decimal:
    recipe = recipes_service.get_recipes_by_id(recipe_id) if recipe_id else None
    portion = _as_decimal(_safe_get(recipe, "portion"))
    if portion is None or portion == 0:
        return Decimal("1")
    return portion


def _compute_unit_costs(
    gross_unit_price: Decimal, quantity: Decimal, percentage_loss: Optional[Decimal]
) -> Dict[str, Decimal | None]:
    gross_total = gross_unit_price * quantity
    loss_multiplier = Decimal("1")
    loss_value: Optional[Decimal] = None

    if percentage_loss is not None and percentage_loss != 0:
        loss_multiplier += percentage_loss / Decimal("100")
        loss_value = (gross_total * loss_multiplier) - gross_total

    unit_cost = gross_total * loss_multiplier
    return {
        "unit_cost": unit_cost,
        "gross_total": gross_total,
        "loss_value": loss_value,
    }


# ============================================================
# Fonction principale
# ============================================================


def edit_article(
    *,
    establishment_id: UUID,
    invoice_id: UUID,
    master_article_id: UUID,
    invoice_date: Any,
    article_id: UUID,
    article_unit: str,
    article_quantity: Any,
    article_new_unit_price: Any,
    article_old_unit_price: Any,
    article_total: Any,
    article_discounts: Any,
    article_duties_and_taxes: Any,
) -> Dict[str, Any]:
    if not establishment_id or not invoice_id or not master_article_id or not article_id:
        raise LogicError("Les paramètres requis sont manquants pour l'édition d'un article")

    target_date = _as_date(invoice_date) or date.today()
    new_unit_price = _as_decimal(article_new_unit_price)
    old_unit_price = _as_decimal(article_old_unit_price)

    # ------------------------------------------------------------------
    # Étape 1 : mise à jour de l'article et du master_article
    # ------------------------------------------------------------------
    article_payload = {
        "unit": article_unit,
        "quantity": _as_decimal(article_quantity),
        "unit_price": new_unit_price,
        "total": _as_decimal(article_total),
        "discounts": _as_decimal(article_discounts),
        "duties_and_taxes": _as_decimal(article_duties_and_taxes),
    }
    articles_service.update_articles(article_id, article_payload)

    latest_articles = articles_service.get_all_articles(
        filters={
            "master_article_id": master_article_id,
            "establishment_id": establishment_id,
            "order_by": "date",
            "direction": "desc",
        },
        limit=1,
    )
    latest_article = latest_articles[0] if latest_articles else None

    master_payload: Dict[str, Any] = {"unit": article_unit}
    latest_unit_price = _as_decimal(_safe_get(latest_article, "unit_price"))
    if latest_unit_price is not None:
        master_payload["current_unit_price"] = latest_unit_price
    master_articles_service.update_master_articles(master_article_id, master_payload)

    # Si le prix unitaire n'a pas changé, on arrête ici
    if new_unit_price == old_unit_price:
        return {
            "updated_article_id": article_id,
            "updated_master_article_id": master_article_id,
            "impacted_ingredients": set(),
            "impacted_recipes": set(),
        }

    # ------------------------------------------------------------------
    # Étape 2 : mise à jour des ingredients et history_ingredients
    # ------------------------------------------------------------------
    impacted_ingredient_ids: Set[UUID] = set()
    impacted_recipe_ids: Set[UUID] = set()
    updated_history_ids: Set[UUID] = set()

    article_ingredients = _paginate_ingredients(
        filters={
            "establishment_id": establishment_id,
            "master_article_id": master_article_id,
            "type": "ARTICLE",
        }
    )

    if not article_ingredients:
        return {
            "updated_article_id": article_id,
            "updated_master_article_id": master_article_id,
            "impacted_ingredients": impacted_ingredient_ids,
            "impacted_recipes": impacted_recipe_ids,
        }

    for ingredient in article_ingredients:
        ingredient_id = _safe_get(ingredient, "id")
        recipe_id = _safe_get(ingredient, "recipe_id")
        if not ingredient_id:
            continue

        histories = history_ingredients_service.get_all_history_ingredients(
            filters={
                "establishment_id": establishment_id,
                "ingredient_id": ingredient_id,
                "source_article_id": article_id,
            },
            limit=1000,
        )

        for history in histories or []:
            history_id = _safe_get(history, "id")
            quantity = _decimal_or_zero(_as_decimal(_safe_get(history, "quantity")))
            percentage_loss = _as_decimal(_safe_get(history, "percentage_loss"))
            costs = _compute_unit_costs(
                gross_unit_price=_decimal_or_zero(new_unit_price),
                quantity=quantity,
                percentage_loss=percentage_loss,
            )

            portion = _ensure_portion(
                _safe_get(history, "recipe_id") or recipe_id
            )
            unit_cost_per_portion = costs["unit_cost"] / portion

            history_payload = {
                "gross_unit_price": _decimal_or_zero(new_unit_price),
                "unit_cost": costs["unit_cost"],
                "loss_value": costs["loss_value"],
                "unit_cost_per_portion_recipe": unit_cost_per_portion,
                "unit": article_unit,
            }
            history_ingredients_service.update_history_ingredients(
                history_id, history_payload
            )
            if history_id:
                updated_history_ids.add(history_id)

        latest_history = history_ingredients_service.get_all_history_ingredients(
            filters={
                "establishment_id": establishment_id,
                "ingredient_id": ingredient_id,
                "order_by": "date",
                "direction": "desc",
            },
            limit=1,
        )
        if latest_history:
            last = latest_history[0]
            ingredient_payload = {
                "gross_unit_price": _as_decimal(_safe_get(last, "gross_unit_price")),
                "unit_cost": _as_decimal(_safe_get(last, "unit_cost")),
                "quantity": _as_decimal(_safe_get(last, "quantity")),
                "unit_cost_per_portion_recipe": _as_decimal(
                    _safe_get(last, "unit_cost_per_portion_recipe")
                ),
                "percentage_loss": _as_decimal(_safe_get(last, "percentage_loss")),
                "loss_value": _as_decimal(_safe_get(last, "loss_value")),
                "unit": article_unit,
            }
            ingredients_service.update_ingredients(ingredient_id, ingredient_payload)

        impacted_ingredient_ids.add(ingredient_id)
        if recipe_id:
            impacted_recipe_ids.add(recipe_id)

    # ------------------------------------------------------------------
    # Étape 3 : mise à jour des recipes directement impactées
    # ------------------------------------------------------------------
    if impacted_recipe_ids:
        update_recipes_and_history_recipes(
            establishment_id=establishment_id,
            recipe_ids=list(impacted_recipe_ids),
            target_date=target_date,
            trigger="invoices",
        )

    # ------------------------------------------------------------------
    # Étape 4 : mise à jour des ingredients SUBRECIPES impactés
    # ------------------------------------------------------------------
    indirect_ingredient_ids: Set[UUID] = set()
    subrecipe_candidates = _paginate_ingredients(
        filters={"establishment_id": establishment_id, "type": "SUBRECIPE"}
    )
    subrecipe_ingredients = [
        ing
        for ing in subrecipe_candidates
        if _safe_get(ing, "subrecipe_id") in impacted_recipe_ids
    ]

    if subrecipe_ingredients:
        indirect_ingredient_ids = {
            _safe_get(ing, "id") for ing in subrecipe_ingredients if _safe_get(ing, "id")
        }
        update_ingredients_and_history_ingredients(
            establishment_id=establishment_id,
            ingredient_ids=list(indirect_ingredient_ids),
            trigger="import",
            target_date=target_date,
            invoice_id=invoice_id,
        )

    # ------------------------------------------------------------------
    # Étape 5 : mise à jour des recipes indirectement impactées
    # ------------------------------------------------------------------
    indirect_recipe_ids: Set[UUID] = {
        _safe_get(ing, "recipe_id")
        for ing in subrecipe_ingredients
        if _safe_get(ing, "recipe_id")
    }

    if indirect_recipe_ids:
        update_recipes_and_history_recipes(
            establishment_id=establishment_id,
            recipe_ids=list(indirect_recipe_ids),
            target_date=target_date,
            trigger="invoices",
        )

    # ------------------------------------------------------------------
    # Étape 6 : mise à jour des marges moyennes
    # ------------------------------------------------------------------
    all_impacted_recipes = impacted_recipe_ids.union(indirect_recipe_ids)
    if all_impacted_recipes:
        recompute_recipe_margins(
            establishment_id=establishment_id,
            recipe_ids=list(all_impacted_recipes),
            target_date=target_date,
        )

    return {
        "updated_article_id": article_id,
        "updated_master_article_id": master_article_id,
        "impacted_ingredients": impacted_ingredient_ids.union(indirect_ingredient_ids),
        "impacted_recipes": all_impacted_recipes,
        "updated_history_ingredients": updated_history_ids,
    }
