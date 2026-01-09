# UTILISER LORSQU'UNE RECETTE EST SUPPRIMÉE

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, List, Optional, Set
from uuid import UUID

from app.logic.write.shared.ingredients_history_ingredients import (
    update_ingredients_and_history_ingredients,
)
from app.logic.write.shared.recipes_average_margins import recompute_recipe_margins
from app.logic.write.shared.recipes_history_recipes import update_recipes_and_history_recipes
from app.services import (
    ingredients_service,
    recipes_service,
    establishments_service,
)
from app.core.supabase_client import supabase

try:
    from app.services.telegram.gordon_service import GordonTelegram

    _telegram_client = GordonTelegram()

    def _notify_recipe_deleted(message: str) -> None:
        _telegram_client.send_text(message)
except Exception:
    def _notify_recipe_deleted(message: str) -> None:
        return


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE."""


# ============================================================
# Helpers locaux
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


def _notify_deletion(
    *, establishment_id: UUID, root_recipe_name: Optional[str], deleted_count: int
) -> None:
    try:
        establishment = establishments_service.get_establishments_by_id(establishment_id)
        establishment_name = _safe_get(establishment, "name") or str(establishment_id)
        suffix = f" ({deleted_count} supprimée(s))" if deleted_count > 1 else ""
        _notify_recipe_deleted(
            "🗑️ Recette supprimée\n"
            f"{root_recipe_name or 'Recette'}{suffix}\n"
            f"{establishment_name}"
        )
    except Exception:
        pass


def _paginate_ingredients_with_subrecipe(
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


def _get_recipes_by_ids(*, establishment_id: UUID, recipe_ids: Set[UUID]) -> Dict[UUID, Any]:
    if not recipe_ids:
        return {}

    recipe_map: Dict[UUID, Any] = {}
    for rid in recipe_ids:
        recipe = recipes_service.get_recipes_by_id(rid)
        if recipe and _safe_get(recipe, "establishment_id") == establishment_id:
            recipe_map[rid] = recipe

    return recipe_map


# ============================================================
# Fonction principale
# ============================================================


def delete_recipe(
    *, recipe_id: UUID, establishment_id: UUID, target_date: Any
) -> Dict[str, Set[UUID]]:
    if not recipe_id or not establishment_id:
        raise LogicError("Les paramètres recipe_id et establishment_id sont requis")

    target_date_norm = _as_date(target_date) or date.today()

    root_recipe = recipes_service.get_recipes_by_id(recipe_id)
    root_recipe_name = _safe_get(root_recipe, "name")

    deleted_ingredient_ids: Set[UUID] = set()
    deleted_recipe_ids: Set[UUID] = set()
    impacted_recipes: Set[UUID] = set()

    pending_recipes: List[UUID] = [recipe_id]

    while pending_recipes:
        current_recipe_id = pending_recipes.pop()
        if current_recipe_id in deleted_recipe_ids:
            continue

        recipe = recipes_service.get_recipes_by_id(current_recipe_id)
        if not recipe or _safe_get(recipe, "establishment_id") != establishment_id:
            continue

        # Ingrédients qui utilisent cette recette en sous-recette
        dependent_ingredients = _paginate_ingredients_with_subrecipe(
            establishment_id=establishment_id,
            subrecipe_id=current_recipe_id,
        )

        local_deleted_ingredient_ids: Set[UUID] = set()
        parent_recipe_ids: Set[UUID] = set()

        # On identifie précisément quels ingrédients supprimer et quelles recettes parent sont impactées
        for ing in dependent_ingredients:
            ing_id = _safe_get(ing, "id")
            parent_id = _safe_get(ing, "recipe_id")
            if ing_id:
                local_deleted_ingredient_ids.add(ing_id)
            if parent_id:
                parent_recipe_ids.add(parent_id)

        # Suppression des ingrédients qui utilisaient cette recette en sous-recette.
        # Les history_ingredients liés sont supprimés automatiquement via ON DELETE CASCADE.
        for ing_id in local_deleted_ingredient_ids:
            if ing_id in deleted_ingredient_ids:
                continue
            ingredients_service.delete_ingredients(ing_id)
            deleted_ingredient_ids.add(ing_id)

        # Nettoyage des history_ingredients qui référencent cette recette en subrecipe.
        supabase.table("history_ingredients") \
            .delete() \
            .eq("subrecipe_id", str(current_recipe_id)) \
            .eq("establishment_id", str(establishment_id)) \
            .execute()
        # Nettoyage des history_ingredients qui référencent cette recette comme parent.
        supabase.table("history_ingredients") \
            .delete() \
            .eq("recipe_id", str(current_recipe_id)) \
            .eq("establishment_id", str(establishment_id)) \
            .execute()

        # Vérifie les recettes parentes impactées : si plus d'ingrédients, on les supprime aussi.
        for parent_id in parent_recipe_ids:
            if parent_id in deleted_recipe_ids:
                continue
            remaining = ingredients_service.get_all_ingredients(
                filters={"recipe_id": parent_id, "establishment_id": establishment_id},
                limit=1,
            )
            if not remaining:
                impacted_recipes.discard(parent_id)
                pending_recipes.append(parent_id)
            else:
                impacted_recipes.add(parent_id)

        # Suppression de la recette (après nettoyage des dépendances)
        recipes_service.delete_recipes(current_recipe_id)
        deleted_recipe_ids.add(current_recipe_id)

    # Recalcul des recettes parentes restantes
    if impacted_recipes:
        update_recipes_and_history_recipes(
            establishment_id=establishment_id,
            recipe_ids=list(impacted_recipes),
            target_date=target_date_norm,
            trigger="manual",
        )
        recompute_recipe_margins(
            establishment_id=establishment_id,
            recipe_ids=list(impacted_recipes),
            target_date=target_date_norm,
        )

    if deleted_recipe_ids:
        _notify_deletion(
            establishment_id=establishment_id,
            root_recipe_name=root_recipe_name,
            deleted_count=len(deleted_recipe_ids),
        )

    return {
        "impacted_recipes": impacted_recipes,
        "deleted_ingredient_ids": deleted_ingredient_ids,
        "deleted_recipes": deleted_recipe_ids,
    }
