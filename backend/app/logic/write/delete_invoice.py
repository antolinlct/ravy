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
    invoices_service,
    master_articles_service,
    recipes_service,
    supplier_alias_service,
    suppliers_service,
)


class LogicError(Exception):
    """Erreur métier dédiée à la suppression d'une facture."""


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
    multiplier = Decimal("1")
    loss_value: Optional[Decimal] = None

    if percentage_loss is not None and percentage_loss != 0:
        multiplier += percentage_loss / Decimal("100")
        loss_value = (gross_total * multiplier) - gross_total

    unit_cost = gross_total * multiplier
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


def delete_invoice(
    *,
    establishment_id: UUID,
    invoice_to_delete_id: UUID,
    invoice_to_delete_date: Any,
    supplier_id: UUID,
) -> Dict[str, Set[UUID] | bool]:
    if not all([establishment_id, invoice_to_delete_id, supplier_id]):
        raise LogicError("Les paramètres requis sont manquants pour la suppression d'une facture")

    target_date = _as_date(invoice_to_delete_date) or date.today()

    # ------------------------------------------------------------------
    # Étape 1 : mise à jour / suppression des master_articles
    # ------------------------------------------------------------------
    list_article_to_delete = articles_service.get_all_articles(
        filters={
            "invoice_id": invoice_to_delete_id,
            "establishment_id": establishment_id,
            "order_by": "date",
            "direction": "desc",
        }
    )
    article_ids_to_delete = {_safe_get(a, "id") for a in list_article_to_delete}

    list_master_article_impacted: Set[UUID] = set()
    for art in list_article_to_delete:
        master_id = _safe_get(art, "master_article_id")
        if master_id:
            list_master_article_impacted.add(master_id)

    master_deleted_map: Dict[UUID, bool] = {}

    for master_id in list_master_article_impacted:
        related_articles = articles_service.get_all_articles(
            filters={
                "master_article_id": master_id,
                "establishment_id": establishment_id,
                "order_by": "date",
                "direction": "desc",
            }
        )
        remaining_articles = [
            a for a in related_articles if _safe_get(a, "id") not in article_ids_to_delete
        ]

        if not remaining_articles:
            master_articles_service.delete_master_articles(master_id)
            master_deleted_map[master_id] = True
            continue

        latest_remaining = remaining_articles[0]
        latest_price = _as_decimal(_safe_get(latest_remaining, "unit_price"))
        update_payload: Dict[str, Any] = {}
        if latest_price is not None:
            update_payload["current_unit_price"] = latest_price
        master_articles_service.update_master_articles(master_id, update_payload)
        master_deleted_map[master_id] = False

    # ------------------------------------------------------------------
    # Étape 2 : mise à jour / suppression du supplier et supplier_alias
    # ------------------------------------------------------------------
    supplier_deleted = False
    if list_master_article_impacted and all(master_deleted_map.values()):
        remaining_supplier_articles = articles_service.get_all_articles(
            filters={
                "establishment_id": establishment_id,
                "supplier_id": supplier_id,
                "invoice_id_neq": invoice_to_delete_id,
                "limit": 1,
            }
        )
        if not remaining_supplier_articles:
            supplier_deleted = True
            supplier_alias = supplier_alias_service.get_all_supplier_alias(
                filters={
                    "establishment_id": establishment_id,
                    "supplier_id": supplier_id,
                }
            )
            for alias in supplier_alias:
                supplier_alias_service.delete_supplier_alias(_safe_get(alias, "id"))
            suppliers_service.delete_suppliers(supplier_id)

    # ------------------------------------------------------------------
    # Étape 3 : mise à jour / suppression des ingredients & history_ingredients
    # ------------------------------------------------------------------
    list_ingredient_impacted: List[Any] = []
    for master_id in list_master_article_impacted:
        list_ingredient_impacted.extend(
            _paginate_ingredients(
                filters={
                    "establishment_id": establishment_id,
                    "master_article_id": master_id,
                    "type": "ARTICLE",
                }
            )
        )

    directly_impacted_recipes_cache: Set[UUID] = set()
    deleted_recipe_ids: Set[UUID] = set()

    for ingredient in list_ingredient_impacted:
        ing_id = _safe_get(ingredient, "id")
        recipe_id = _safe_get(ingredient, "recipe_id")
        master_id = _safe_get(ingredient, "master_article_id")

        if recipe_id:
            directly_impacted_recipes_cache.add(recipe_id)

        if master_deleted_map.get(master_id):
            histories = history_ingredients_service.get_all_history_ingredients(
                filters={"ingredient_id": ing_id, "establishment_id": establishment_id}
            )
            _delete_history_ingredients(histories)
            if ing_id:
                ingredients_service.delete_ingredients(ing_id)
            continue

        histories_to_purge = history_ingredients_service.get_all_history_ingredients(
            filters={
                "ingredient_id": ing_id,
                "establishment_id": establishment_id,
            }
        )
        purge_ids = [
            h
            for h in histories_to_purge
            if _safe_get(h, "source_article_id") in article_ids_to_delete
        ]
        _delete_history_ingredients(purge_ids)

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
    # Étape 4 : mise à jour des recettes directement impactées
    # ------------------------------------------------------------------
    recipe_ids_to_update: Set[UUID] = set()
    for rid in directly_impacted_recipes_cache:
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
    # Étape 5 : mise à jour des ingredients SUBRECIPES impactés
    # ------------------------------------------------------------------
    subrecipe_ingredients: List[Any] = []
    impacted_recipe_ids = directly_impacted_recipes_cache | recipe_ids_to_update | deleted_recipe_ids
    for recipe_id in impacted_recipe_ids:
        subrecipe_ingredients.extend(
            _paginate_ingredients(
                filters={
                    "establishment_id": establishment_id,
                    "type": "SUBRECIPES",
                    "subrecipes_id": recipe_id,
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
            invoice_id=invoice_to_delete_id,
        )

    # ------------------------------------------------------------------
    # Étape 6 : mise à jour des recettes indirectement impactées
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
    # Étape 7 : mise à jour des marges moyennes
    # ------------------------------------------------------------------
    margin_recipe_ids = (recipe_ids_to_update | secondary_recipe_ids) - deleted_recipe_ids
    if margin_recipe_ids:
        recompute_recipe_margins(
            establishment_id=establishment_id,
            recipe_ids=list(margin_recipe_ids),
            target_date=target_date,
        )

    # ------------------------------------------------------------------
    # Étape 8 : suppression des résidus articles et invoices
    # ------------------------------------------------------------------
    for art in list_article_to_delete:
        articles_service.delete_articles(_safe_get(art, "id"))
    invoices_service.delete_invoices(invoice_to_delete_id)

    return {
        "deleted_master_articles": {mid for mid, deleted in master_deleted_map.items() if deleted},
        "deleted_recipes": deleted_recipe_ids,
        "updated_recipes": recipe_ids_to_update | secondary_recipe_ids,
        "deleted_supplier": supplier_deleted,
    }
