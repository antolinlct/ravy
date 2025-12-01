# UTILSIER POUR GÉRER LES CAS OU UNE RECETTE EST DUPLIQUÉ

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.logic.write.shared.ingredients_history_ingredients import (
    update_ingredients_and_history_ingredients,
)
from app.logic.write.shared.recipes_history_recipes import update_recipes_and_history_recipes
from app.logic.write.shared.recipes_average_margins import recompute_recipe_margins
from app.services import ingredients_service, recipes_service


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE."""


# ============================================================
# Helpers génériques
# ============================================================


def _safe_get(obj: Any, key: str) -> Any:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


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


def _duplicate_recipe_payload(base_recipe: Any, new_name: str) -> Dict[str, Any]:
    """
    Construit le payload minimal et propre pour créer une recette dupliquée.
    Ne copie pas les champs calculés (coûts, marges), ils seront recalculés
    par les sous-logiques.
    """

    fields_to_copy = [
        "establishment_id",
        "vat_id",
        "recommanded_retail_price",
        "active",
        "saleable",
        "contains_sub_recipe",
        "portion",
        "technical_data_sheet_instructions",
        "portion_weight",
        "price_excl_tax",
        "price_incl_tax",
        "price_tax",
        "category_id",
        "subcategory_id",
        "created_by",
        "updated_by",
        "technical_data_sheet_image_path",
    ]

    decimal_fields = {
        "recommanded_retail_price",
        "portion",
        "portion_weight",
        "price_excl_tax",
        "price_incl_tax",
        "price_tax",
    }

    payload: Dict[str, Any] = {"name": new_name}

    for key in fields_to_copy:
        value = _safe_get(base_recipe, key)
        payload[key] = _as_decimal(value) if key in decimal_fields else value

    return payload


def _duplicate_ingredient_payload(ingredient: Any, new_recipe_id: UUID) -> Dict[str, Any]:
    """
    Payload propre pour un ingrédient dupliqué.
    Ne copie pas les champs calculés (unit_cost, gross_unit_price, etc.).
    Ces valeurs seront recalculées par la sous-logique ingredients_history_ingredients.
    """

    fields_to_copy = [
        "type",
        "master_article_id",
        "subrecipe_id",
        "unit",
        "quantity",
        "establishment_id",
        "created_by",
        "updated_by",
    ]

    decimal_fields = {"quantity"}

    payload: Dict[str, Any] = {"recipe_id": new_recipe_id}

    for key in fields_to_copy:
        value = _safe_get(ingredient, key)
        payload[key] = _as_decimal(value) if key in decimal_fields else value

    return payload



# ============================================================
# Fonction principale
# ============================================================


def duplicate_recipe(
    *,
    recipe_id: UUID,
    establishment_id: UUID,
    new_name: str,
    target_date: Any | None = None,
) -> Dict[str, Any]:
    if not recipe_id or not establishment_id or not new_name:
        raise LogicError("Les paramètres recipe_id, establishment_id et new_name sont obligatoires")

    target_date_norm = _as_date(target_date) or date.today()

    base_recipe = recipes_service.get_recipes_by_id(recipe_id)
    if not base_recipe or _safe_get(base_recipe, "establishment_id") != establishment_id:
        raise LogicError("Recette introuvable pour l'établissement fourni")

    recipe_payload = _duplicate_recipe_payload(base_recipe, new_name)
    recipe_payload["establishment_id"] = establishment_id
    new_recipe = recipes_service.create_recipes(recipe_payload)
    new_recipe_id = _safe_get(new_recipe, "id")
    if not new_recipe_id:
        raise LogicError("La création de la recette dupliquée a échoué")

    ingredients = ingredients_service.get_all_ingredients(
        filters={"recipe_id": recipe_id, "establishment_id": establishment_id},
        limit=1000,
    )

    new_ingredient_ids: List[UUID] = []
    for ing in ingredients:
        ing_payload = _duplicate_ingredient_payload(ing, new_recipe_id)
        ing_payload["establishment_id"] = establishment_id
        created_ing = ingredients_service.create_ingredients(ing_payload)
        created_ing_id = _safe_get(created_ing, "id")
        if created_ing_id:
            new_ingredient_ids.append(created_ing_id)

    if new_ingredient_ids:
        update_ingredients_and_history_ingredients(
            establishment_id=establishment_id,
            ingredient_ids=new_ingredient_ids,
            trigger="manual",
            target_date=target_date_norm,
        )

    update_recipes_and_history_recipes(
        establishment_id=establishment_id,
        recipe_ids=[new_recipe_id],
        target_date=target_date_norm,
        trigger="manual",
    )

    recompute_recipe_margins(
        establishment_id=establishment_id,
        recipe_ids=[new_recipe_id],
        target_date=target_date_norm,
    )

    return {
    "new_recipe_id": new_recipe_id,
    "ingredient_ids": list(set(new_ingredient_ids)),
    }