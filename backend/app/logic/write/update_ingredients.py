#  UTILISER LORSQU'UN INGREDIENT EST MIS À JOUR

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Set
from uuid import UUID

from app.logic.write.shared.ingredients_history_ingredients import (
    update_ingredients_and_history_ingredients,
)
from app.logic.write.shared.recipes_average_margins import recompute_recipe_margins
from app.logic.write.shared.recipes_history_recipes import update_recipes_and_history_recipes
from app.services import ingredients_service, recipes_service


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE."""

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
        value_str = value.strip()
        if not value_str:
            return None
        try:
            return Decimal(value_str)
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


def _paginate_ingredients(
    *, establishment_id: UUID, subrecipe_id: UUID, page_size: int = 500
) -> List[Any]:
    page = 1
    collected: List[Any] = []
    while True:
        batch = ingredients_service.get_all_ingredients(
            filters={"subrecipe_id": subrecipe_id, "establishment_id": establishment_id},
            limit=page_size,
            page=page,
        )
        if not batch:
            break
        collected.extend(batch)
        if len(batch) < page_size:
            break
        page += 1
    return collected


def _get_recipes_by_ids(
    *, establishment_id: UUID, recipe_ids: Set[UUID]
) -> Dict[UUID, Any]:
    if not recipe_ids:
        return {}

    recipes = recipes_service.get_all_recipes(
        filters={
            "establishment_id": establishment_id,
            "id__in": list(recipe_ids),
        }
    )

    recipe_map: Dict[UUID, Any] = {}
    for recipe in recipes or []:
        rid = _safe_get(recipe, "id")
        if rid in recipe_ids:
            recipe_map[rid] = recipe

    return recipe_map

# ============================================================
# Fonction principale
# ============================================================

def update_ingredient(
    *,
    ingredient_id: UUID,
    recipe_id: UUID,
    establishment_id: UUID,
    target_date: Any,
) -> Dict[str, Set[UUID]]:
    if not ingredient_id or not recipe_id or not establishment_id:
        raise LogicError("Les paramètres ingredient_id, recipe_id et establishment_id sont requis")

    target_date_norm = _as_date(target_date) or date.today()

    ingredient = ingredients_service.get_ingredients_by_id(ingredient_id)
    if not ingredient or _safe_get(ingredient, "establishment_id") != establishment_id:
        raise LogicError("Ingrédient introuvable pour l'établissement fourni")
    if _safe_get(ingredient, "recipe_id") != recipe_id:
        raise LogicError("L'ingrédient ne correspond pas à la recette fournie")

    update_ingredients_and_history_ingredients(
        establishment_id=establishment_id,
        ingredient_ids=[ingredient_id],
        trigger="manual",
        target_date=target_date_norm,
    )

    update_recipes_and_history_recipes(
        establishment_id=establishment_id,
        recipe_ids=[recipe_id],
        target_date=target_date_norm,
        trigger="manual",
    )

    dependent_ingredients = _paginate_ingredients(
        establishment_id=establishment_id, subrecipe_id=recipe_id
    )
    dependent_ids: List[UUID] = []
    parent_recipe_ids: Set[UUID] = set()
    for ing in dependent_ingredients:
        ing_id = _safe_get(ing, "id")
        parent_id = _safe_get(ing, "recipe_id")
        if ing_id:
            dependent_ids.append(ing_id)
        if parent_id:
            parent_recipe_ids.add(parent_id)

    if dependent_ids:
        update_ingredients_and_history_ingredients(
            establishment_id=establishment_id,
            ingredient_ids=dependent_ids,
            trigger="manual",
            target_date=target_date_norm,
        )

    if parent_recipe_ids:
        update_recipes_and_history_recipes(
            establishment_id=establishment_id,
            recipe_ids=list(parent_recipe_ids),
            target_date=target_date_norm,
            trigger="manual",
        )

    impacted_recipes: Set[UUID] = set(parent_recipe_ids)
    impacted_recipes.add(recipe_id)

    if impacted_recipes:
        recipe_map = _get_recipes_by_ids(
            establishment_id=establishment_id, recipe_ids=impacted_recipes
        )

        margin_recipe_ids = set()
        for rid, rec in recipe_map.items():
            saleable_val = _safe_get(rec, "saleable")
            active_val = _safe_get(rec, "active")
            is_saleable = True if saleable_val is None else bool(saleable_val)
            is_active = True if active_val is None else bool(active_val)
            if is_saleable and is_active:
                margin_recipe_ids.add(rid)

        if margin_recipe_ids:
            recompute_recipe_margins(
                establishment_id=establishment_id,
                recipe_ids=list(margin_recipe_ids),
                target_date=target_date_norm,
            )

    return {
        "impacted_recipes": impacted_recipes,
        "dependent_ingredient_ids": set(dependent_ids),
    }