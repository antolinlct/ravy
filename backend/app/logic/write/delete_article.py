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
    history_recipes_service,
    ingredients_service,
    master_articles_service,
    recipes_service,
)


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE pour la suppression d'articles."""


# ============================================================
# Helpers génériques
# ============================================================


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


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
        except Exception:
            return None
    return None


def _decimal_or_zero(value: Optional[Decimal]) -> Decimal:
    return value if value is not None else Decimal("0")


def _paginate_ingredients(*, filters: Dict[str, Any], page_size: int = 500) -> List[Any]:
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


def _compute_unit_costs(
    *, gross_unit_price: Decimal, quantity: Decimal, percentage_loss: Optional[Decimal]
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
        "loss_value": loss_value,
    }


def _ensure_portion(recipe_id: Optional[UUID]) -> Decimal:
    recipe = recipes_service.get_recipes_by_id(recipe_id) if recipe_id else None
    portion = _as_decimal(_safe_get(recipe, "portion"))
    if portion is None or portion == 0:
        return Decimal("1")
    return portion


def _delete_history_ingredients(ids: List[Any]) -> None:
    for hid in ids:
        history_ingredients_service.delete_history_ingredients(_safe_get(hid, "id", hid))


def _delete_history_recipes(ids: List[Any]) -> None:
    for hid in ids:
        history_recipes_service.delete_history_recipes(_safe_get(hid, "id", hid))


# ============================================================
# Fonction principale
# ============================================================


def delete_article(
    *,
    establishment_id: UUID,
    invoice_id: UUID,
    invoice_date: Any,
    master_article_id: UUID,
    supplier_id: UUID,
    id_article_to_delete: UUID,
) -> Dict[str, Set[UUID]]:
    if not all([establishment_id, invoice_id, master_article_id, supplier_id, id_article_to_delete]):
        raise LogicError("Les paramètres requis sont manquants pour la suppression d'un article")

    target_date = _as_date(invoice_date) or date.today()

    # ------------------------------------------------------------------
    # Étape 1 : mise à jour / suppression du master_article
    # ------------------------------------------------------------------
    related_articles = articles_service.get_all_articles(
        filters={
            "master_article_id": master_article_id,
            "establishment_id": establishment_id,
            "supplier_id": supplier_id,
            "order_by": "date",
            "direction": "desc",
        }
    )
    remaining_articles = [a for a in related_articles if _safe_get(a, "id") != id_article_to_delete]

    master_deleted = False
    if not remaining_articles:
        master_articles_service.delete_master_articles(master_article_id)
        master_deleted = True
    else:
        latest_remaining = remaining_articles[0]
        latest_price = _as_decimal(_safe_get(latest_remaining, "unit_price"))
        payload: Dict[str, Any] = {}
        if latest_price is not None:
            payload["current_unit_price"] = latest_price
        master_articles_service.update_master_articles(master_article_id, payload)

    # ------------------------------------------------------------------
    # Étape 2 : mise à jour / suppression des ingredients et history_ingredients
    # ------------------------------------------------------------------
    article_ingredients = _paginate_ingredients(
        filters={
            "establishment_id": establishment_id,
            "master_article_id": master_article_id,
            "type": "ARTICLE",
        }
    )

    impacted_recipe_ids: Set[UUID] = set()
    deleted_recipe_ids: Set[UUID] = set()

    for ingredient in article_ingredients:
        ing_id = _safe_get(ingredient, "id")
        recipe_id = _safe_get(ingredient, "recipe_id")
        if recipe_id:
            impacted_recipe_ids.add(recipe_id)

        if master_deleted:
            # Suppression complète de l'ingrédient et de ses historiques
            histories = history_ingredients_service.get_all_history_ingredients(
                filters={"ingredient_id": ing_id, "establishment_id": establishment_id}
            )
            _delete_history_ingredients(histories)
            if ing_id:
                ingredients_service.delete_ingredients(ing_id)
            continue

        # Suppression des history_ingredients liés à l'article supprimé
        histories_to_purge = history_ingredients_service.get_all_history_ingredients(
            filters={
                "ingredient_id": ing_id,
                "establishment_id": establishment_id,
                "source_article_id": id_article_to_delete,
            }
        )
        _delete_history_ingredients(histories_to_purge)

        remaining_histories = history_ingredients_service.get_all_history_ingredients(
            filters={
                "ingredient_id": ing_id,
                "establishment_id": establishment_id,
                "order_by": "date",
                "direction": "desc",
            }
        )

        if not remaining_histories:
            if ing_id:
                ingredients_service.delete_ingredients(ing_id)
            continue

        latest_history = remaining_histories[0]

        quantity = _decimal_or_zero(_as_decimal(_safe_get(ingredient, "quantity")))
        percentage_loss = _as_decimal(_safe_get(ingredient, "percentage_loss"))
        gross_unit_price = _decimal_or_zero(_as_decimal(_safe_get(latest_history, "gross_unit_price")))

        costs = _compute_unit_costs(
            gross_unit_price=gross_unit_price,
            quantity=quantity,
            percentage_loss=percentage_loss,
        )
        portion = _ensure_portion(recipe_id)
        unit_cost_per_portion = costs["unit_cost"] / portion

        history_payload = {
            "quantity": quantity,
            "percentage_loss": percentage_loss,
            "unit_cost": costs["unit_cost"],
            "loss_value": costs["loss_value"],
            "unit_cost_per_portion_recipe": unit_cost_per_portion,
        }
        history_ingredients_service.update_history_ingredients(
            _safe_get(latest_history, "id"), history_payload
        )

        ingredient_payload = {
            "unit_cost": costs["unit_cost"],
            "gross_unit_price": gross_unit_price,
            "loss_value": costs["loss_value"],
            "unit_cost_per_portion_recipe": unit_cost_per_portion,
        }
        if ing_id:
            ingredients_service.update_ingredients(ing_id, ingredient_payload)

    # ------------------------------------------------------------------
    # Étape 3 : mise à jour des recettes directement impactées
    # ------------------------------------------------------------------
    recipe_ids_to_update: Set[UUID] = set()
    for rid in impacted_recipe_ids:
        ingredients_left = ingredients_service.get_all_ingredients(
            filters={"recipe_id": rid, "establishment_id": establishment_id}
        )
        if not ingredients_left:
            histories = history_recipes_service.get_all_history_recipes(
                filters={"recipe_id": rid, "establishment_id": establishment_id}
            )
            _delete_history_recipes(histories)
            recipes_service.delete_recipes(rid)
            deleted_recipe_ids.add(rid)
            continue
        recipe_ids_to_update.add(rid)

    if recipe_ids_to_update:
        update_recipes_and_history_recipes(
            establishment_id=establishment_id,
            recipe_ids=list(recipe_ids_to_update),
            target_date=target_date,
            trigger="invoices",
        )

    # ------------------------------------------------------------------
    # Étape 4 : mise à jour des ingredients SUBRECIPES impactés
    # ------------------------------------------------------------------
    subrecipe_ingredients: List[Any] = []
    if impacted_recipe_ids:
        for sub_id in impacted_recipe_ids:
            subrecipe_ingredients.extend(
                _paginate_ingredients(
                    filters={
                        "establishment_id": establishment_id,
                        "type": "SUBRECIPES",
                        "subrecipes_id": sub_id,
                    }
                )
            )

    parent_recipe_ids: Set[UUID] = set()
    subrecipe_ids_to_update: Set[UUID] = set()

    for ing in subrecipe_ingredients:
        ing_id = _safe_get(ing, "id")
        parent_recipe_id = _safe_get(ing, "recipe_id")
        sub_id = _safe_get(ing, "subrecipe_id") or _safe_get(ing, "subrecipes_id")
        if parent_recipe_id:
            parent_recipe_ids.add(parent_recipe_id)

        if sub_id in deleted_recipe_ids:
            histories = history_ingredients_service.get_all_history_ingredients(
                filters={"ingredient_id": ing_id, "establishment_id": establishment_id}
            )
            _delete_history_ingredients(histories)
            if ing_id:
                ingredients_service.delete_ingredients(ing_id)
            continue

        if ing_id:
            subrecipe_ids_to_update.add(ing_id)

    if subrecipe_ids_to_update:
        update_ingredients_and_history_ingredients(
            establishment_id=establishment_id,
            ingredient_ids=list(subrecipe_ids_to_update),
            trigger="import",
            target_date=target_date,
            invoice_id=invoice_id,
        )

    # ------------------------------------------------------------------
    # Étape 5 : mise à jour des recettes indirectement impactées
    # ------------------------------------------------------------------
    secondary_recipe_ids: Set[UUID] = set()
    for rid in parent_recipe_ids:
        ingredients_left = ingredients_service.get_all_ingredients(
            filters={"recipe_id": rid, "establishment_id": establishment_id}
        )
        if not ingredients_left:
            histories = history_recipes_service.get_all_history_recipes(
                filters={"recipe_id": rid, "establishment_id": establishment_id}
            )
            _delete_history_recipes(histories)
            recipes_service.delete_recipes(rid)
            deleted_recipe_ids.add(rid)
            continue
        secondary_recipe_ids.add(rid)

    if secondary_recipe_ids:
        update_recipes_and_history_recipes(
            establishment_id=establishment_id,
            recipe_ids=list(secondary_recipe_ids),
            target_date=target_date,
            trigger="invoices",
        )

    # ------------------------------------------------------------------
    # Étape 6 : mise à jour des marges moyennes
    # ------------------------------------------------------------------
    margin_recipe_ids = (recipe_ids_to_update | secondary_recipe_ids) - deleted_recipe_ids
    if margin_recipe_ids:
        recompute_recipe_margins(
            establishment_id=establishment_id,
            recipe_ids=list(margin_recipe_ids),
            target_date=target_date,
        )

    # ------------------------------------------------------------------
    # Suppression finale de l'article
    # ------------------------------------------------------------------
    articles_service.delete_articles(id_article_to_delete)

    return {
        "deleted_master_article": master_deleted,
        "impacted_recipes": recipe_ids_to_update | secondary_recipe_ids,
        "deleted_recipes": deleted_recipe_ids,
    }
