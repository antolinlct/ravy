# UTILISER POUR CALCULER/METTRE A JOUR L'ENSEMBLE DES RECIPES ET HISTORY_RECIPES

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple
from uuid import UUID

from app.services import (
    history_recipes_service,
    ingredients_service,
    recipes_service,
)


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

        # Cas FR avec virgule décimale
        if "," in raw:
            # Séparer décimal
            parts = raw.rsplit(",", 1)
            integer_part = parts[0]
            decimal_part = parts[1]

            # Supprimer tous les points dans la partie entière (séparateurs milliers FR)
            integer_part = integer_part.replace(".", "")

            # Recomposer en format US
            raw = integer_part + "." + decimal_part

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


def _ensure_portion(portion: Optional[Decimal]) -> Decimal:
    if portion is None or portion == 0:
        return Decimal("1")
    return portion


def _split_histories(
    histories: Iterable[Any], target_date: date
) -> Tuple[List[Any], List[Any]]:
    ordered = sorted(
        histories,
        key=lambda h: _as_date(_safe_get(h, "date")) or date.min,
    )
    future: List[Any] = []
    past_or_same: List[Any] = []
    for history in ordered:
        history_date = _as_date(_safe_get(history, "date"))
        if history_date is None:
            continue
        if history_date > target_date:
            future.append(history)
        else:
            past_or_same.append(history)
    return past_or_same, future


def _compute_manual_version(histories: Sequence[Any]) -> Decimal:
    ordered = sorted(
        histories,
        key=lambda h: _as_date(_safe_get(h, "date")) or date.min,
        reverse=True,
    )
    for history in ordered:
        version = _as_decimal(_safe_get(history, "version_number"))
        if version is None:
            continue
        if version == version.to_integral_value():
            return version + Decimal("1")
    return Decimal("1")


# ============================================================
# Fonction principale
# ============================================================


def update_recipes_and_history_recipes(
    *,
    establishment_id: UUID,
    recipe_ids: Sequence[UUID] | UUID,
    target_date: date,
    trigger: str,
) -> Dict[str, Set[UUID]]:
    if trigger not in {"invoices", "manual"}:
        raise LogicError("Trigger invalide pour la mise à jour des recettes")

    target_date_norm = _as_date(target_date) or date.today()
    recipe_ids_list = (
        list(recipe_ids) if isinstance(recipe_ids, (list, tuple, set)) else [recipe_ids]
    )

    # ON COMMENCE PAR DÉFINIR UN ENSEMBLE DE VARIABLES QU'ON APPLIQUERA EN FONCTION DU CAS

    all_recipes: Set[UUID] = set()
    recipes_with_subrecipes: Set[UUID] = set()

    for recipe_id in recipe_ids_list:
        recipe = recipes_service.get_recipes_by_id(recipe_id)
        if not recipe or _safe_get(recipe, "establishment_id") != establishment_id:
            continue

        ingredients = ingredients_service.get_all_ingredients(
            filters={
                "recipe_id": recipe_id,
                "establishment_id": establishment_id,
            },
            limit=1000,
        )
        contains_sub_recipe = any(_safe_get(ing, "type") == "SUBRECIPE" for ing in ingredients)

        purchase_cost_total = Decimal("0")
        for ing in ingredients:
            unit_cost = _as_decimal(_safe_get(ing, "unit_cost"))
            if unit_cost is not None:
                purchase_cost_total += unit_cost

        portion_recipe = _ensure_portion(_as_decimal(_safe_get(recipe, "portion")))
        purchase_cost_per_portion = purchase_cost_total / portion_recipe

        price_excl_tax = _as_decimal(_safe_get(recipe, "price_excl_tax"))
        margin = None
        if _safe_get(recipe, "saleable"):
            if price_excl_tax and price_excl_tax != 0:
                margin = ((price_excl_tax - purchase_cost_per_portion) / price_excl_tax) * Decimal("100")

        histories = history_recipes_service.get_all_history_recipes(
            filters={
                "recipe_id": recipe_id,
                "establishment_id": establishment_id,
                "order_by": "date",
                "direction": "asc",
            },
            limit=1000,
        )
        past_or_same, future_histories = _split_histories(histories, target_date_norm)

        #GESTION DE LA CREATION D'UN NOUVEL HISTORY_RECIPE
        if not histories or not future_histories:
            last_history = past_or_same[-1] if past_or_same else None
            if trigger == "manual":
                version_number = _compute_manual_version(histories)
                contains_sub_value = contains_sub_recipe
            else:
                prev_version = _as_decimal(_safe_get(last_history, "version_number"))
                version_number = (prev_version + Decimal("0.01")) if prev_version else Decimal("1")
                contains_sub_value = _safe_get(last_history, "contains_sub_recipe")

            payload = {
                "recipe_id": recipe_id,
                "establishment_id": establishment_id,
                "date": datetime.combine(target_date_norm, time()),
                "purchase_cost_total": purchase_cost_total,
                "purchase_cost_per_portion": purchase_cost_per_portion,
                "portion": portion_recipe,
                "invoice_affected": trigger != "manual",
                "vat_id": _safe_get(recipe, "vat_id"),
                "price_excl_tax": price_excl_tax,
                "price_incl_tax": _as_decimal(_safe_get(recipe, "price_incl_tax")),
                "price_tax": _as_decimal(_safe_get(recipe, "price_tax")),
                "margin": margin,
                "version_number": version_number,
                "contains_sub_recipe": contains_sub_value if trigger != "manual" else contains_sub_recipe,
            }
            new_history = history_recipes_service.create_history_recipes(payload)
            if new_history:
                histories.append(new_history)
        
        #GESTION DE LA MODIFICATION D'UN NOUVEL HISTORY_RECIPE
        else:
            history_to_update = max( # On récupère l'historique le plus récent qui existe.
                future_histories,
                key=lambda h: _as_date(_safe_get(h, "date")) or date.min
            )

            portion_hist = _ensure_portion(
                _as_decimal(_safe_get(history_to_update, "portion")) or portion_recipe
            )
            margin_update = None
            if _safe_get(recipe, "saleable"):
                if price_excl_tax and price_excl_tax != 0:
                    margin_update = ((price_excl_tax - purchase_cost_total / portion_hist) / price_excl_tax) * Decimal("100")

            update_payload = {
                "purchase_cost_total": purchase_cost_total,
                "purchase_cost_per_portion": purchase_cost_total / portion_hist,
                "invoice_affected": trigger != "manual",
                "margin": margin_update,
            }
            history_recipes_service.update_history_recipes(
                _safe_get(history_to_update, "id"), update_payload
            )

        if histories:
            latest_history = max(
                histories,
                key=lambda h: _as_date(_safe_get(h, "date")) or date.min,
            )
            recipe_payload = {
                "purchase_cost_total": _as_decimal(_safe_get(latest_history, "purchase_cost_total")),
                "purchase_cost_per_portion": _as_decimal(
                    _safe_get(latest_history, "purchase_cost_per_portion")
                ),
            }
            if _safe_get(recipe, "saleable"):
                recipe_payload["current_margin"] = _as_decimal(_safe_get(latest_history, "margin"))
            recipes_service.update_recipes(recipe_id, recipe_payload)

        all_recipes.add(recipe_id)
        if contains_sub_recipe:
            recipes_with_subrecipes.add(recipe_id)

    return {
        "all_recipes": all_recipes,
        "recipes_with_subrecipes": recipes_with_subrecipes,
    }