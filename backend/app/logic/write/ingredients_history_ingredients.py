from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple
from uuid import UUID

from app.services import (
    articles_service,
    history_ingredients_service,
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


def _ensure_portion(recipe_id: Optional[UUID], portion: Optional[Decimal]) -> Decimal:
    if portion is None or portion == 0:
        return Decimal("1")
    return portion


def _split_histories(
    histories: Iterable[Any], target_date: date
) -> Tuple[Optional[Any], Optional[Any], Optional[Any]]:
    ordered = sorted(
        histories,
        key=lambda h: _as_date(_safe_get(h, "date")) or date.min,
    )
    same_day = None
    h_prev = None
    h_next = None
    for history in ordered:
        history_date = _as_date(_safe_get(history, "date"))
        if history_date is None:
            continue
        if history_date == target_date:
            same_day = history
        if history_date <= target_date:
            h_prev = history
        elif history_date > target_date and h_next is None:
            h_next = history
    return same_day, h_prev, h_next


def _history_reference_for_ingredient(
    histories: Iterable[Any], target_date: date
) -> Tuple[Optional[Any], Optional[Any]]:
    _, h_prev, h_next = _split_histories(histories, target_date)
    return h_prev, h_next


def _compute_loss_and_cost(
    gross_unit_price: Decimal, quantity: Decimal, percentage_loss: Optional[Decimal]
) -> Tuple[Decimal, Decimal, Optional[Decimal]]:
    loss_multiplier = Decimal("1")
    if percentage_loss is not None:
        loss_multiplier += percentage_loss / Decimal("100")
    gross_total = gross_unit_price * quantity
    unit_cost = gross_total * loss_multiplier
    loss_value = unit_cost - gross_total if percentage_loss and percentage_loss > 0 else None
    return unit_cost, gross_total, loss_value


def _compute_import_version(
    prev: Optional[Decimal], next: Optional[Decimal], base_is_prev: bool
) -> Decimal:
    if base_is_prev:
        if prev is None:
            if next is None:
                raise LogicError("Aucun historique trouvé pour un import d'ingrédient")
            return next - Decimal("0.01")
        return prev + Decimal("0.01")
    if next is None:
        raise LogicError("Aucun historique trouvé pour un import d'ingrédient")
    return next - Decimal("0.01")


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


def update_ingredients_and_history_ingredients(
    *,
    establishment_id: UUID,
    ingredient_ids: Sequence[UUID],
    trigger: str,
    target_date: date,
    invoice_id: Optional[UUID] = None,
) -> Dict[str, Set[UUID]]:
    if trigger not in {"import", "manual"}:
        raise LogicError("Trigger invalide pour la mise à jour des ingrédients")

    target_date_norm = _as_date(target_date) or date.today()

    def _get_histories(ingredient_id: UUID) -> List[Any]:
        return history_ingredients_service.get_all_history_ingredients(
            filters={
                "ingredient_id": ingredient_id,
                "establishment_id": establishment_id,
                "order_by": "date",
                "direction": "asc",
            },
            limit=1000,
        )

    def _portion_for_recipe(recipe_id: Optional[UUID]) -> Decimal:
        recipe = _get_recipe(recipe_id)
        return _ensure_portion(recipe_id, _as_decimal(_safe_get(recipe, "portion")))

    def _update_ingredient_from_history(ingredient: Any, history: Any) -> None:
        ingredient_payload = {
            "gross_unit_price": _as_decimal(_safe_get(history, "gross_unit_price")),
            "unit_cost": _as_decimal(_safe_get(history, "unit_cost")),
            "unit_cost_per_portion_recipe": _as_decimal(
                _safe_get(history, "unit_cost_per_portion_recipe")
            ),
            "percentage_loss": _as_decimal(_safe_get(history, "percentage_loss")),
            "loss_value": _as_decimal(_safe_get(history, "loss_value")),
            "quantity": _as_decimal(_safe_get(history, "quantity")),
        }
        ingredients_service.update_ingredients(_safe_get(ingredient, "id"), ingredient_payload)

    # Chargement des ingrédients concernés
    ingredient_ids_set = set(ingredient_ids)
    ingredients: List[Any] = []
    for iid in ingredient_ids_set:
        ingredient = ingredients_service.get_ingredients_by_id(iid)
        if ingredient and _safe_get(ingredient, "establishment_id") == establishment_id:
            ingredients.append(ingredient)

    ingredients_article = [
        ing
        for ing in ingredients
        if _safe_get(ing, "type") == "ARTICLE" and _safe_get(ing, "master_article_id") is not None
    ]
    ingredients_subrecipes = [
        ing
        for ing in ingredients
        if _safe_get(ing, "type") == "SUBRECIPE" and _safe_get(ing, "subrecipe_id") is not None
    ]
    ingredients_fixed = [ing for ing in ingredients if _safe_get(ing, "type") == "FIXED"]

    recipe_ids_needed: Set[UUID] = set(
        filter(
            None,
            (
                _safe_get(ing, "recipe_id")
                for ing in ingredients
            ),
        )
    )
    recipe_ids_needed.update(
        filter(
            None,
            (_safe_get(ing, "subrecipe_id") for ing in ingredients_subrecipes),
        )
    )

    recipes_cache: Dict[UUID, Any] = {}
    if recipe_ids_needed:
        fetched_recipes = recipes_service.get_all_recipes(
            filters={"establishment_id": establishment_id},
            limit=max(200, len(recipe_ids_needed)),
        )
        recipes_cache = {
            _safe_get(r, "id"): r
            for r in fetched_recipes
            if _safe_get(r, "id") in recipe_ids_needed
        }

    def _get_recipe(recipe_id: Optional[UUID]) -> Optional[Any]:
        if recipe_id is None:
            return None
        recipe = recipes_cache.get(recipe_id)
        if recipe is None:
            return None
        if _safe_get(recipe, "establishment_id") != establishment_id:
            return None
        return recipe

    recipes_directly_impacted: Set[UUID] = set()
    recipes_indirectly_impacted: Set[UUID] = set()
    ingredients_processed: Set[UUID] = set()

    # --------------------------------------------------------
    # ARTICLE – import
    # --------------------------------------------------------
    if trigger == "import":
        for ingredient in ingredients_article:
            if invoice_id is None:
                raise LogicError("invoice_id est requis pour un import d'ingrédient ARTICLE")

            ingredient_id = _safe_get(ingredient, "id")
            recipe_id = _safe_get(ingredient, "recipe_id")
            master_article_id = _safe_get(ingredient, "master_article_id")
            if master_article_id is None:
                continue

            articles = articles_service.get_all_articles(
                filters={
                    "master_article_id": master_article_id,
                    "invoice_id": invoice_id,
                    "order_by": "date",
                    "direction": "desc",
                    "establishment_id": establishment_id,
                },
                limit=50,
            )
            if not articles:
                continue
            article = articles[0]
            gross_unit_price = _as_decimal(_safe_get(article, "unit_price"))
            if gross_unit_price is None:
                continue

            histories = _get_histories(ingredient_id)
            same_day_history, h_prev, h_next = _split_histories(histories, target_date_norm)

            quantity_reference = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
            percentage_loss = _as_decimal(_safe_get(ingredient, "percentage_loss")) or Decimal("0")
            base_history = None
            unit = _safe_get(ingredient, "unit")

            if same_day_history:
                base_history = same_day_history
                quantity_reference = _as_decimal(_safe_get(base_history, "quantity")) or quantity_reference
                percentage_loss = _as_decimal(_safe_get(base_history, "percentage_loss")) or percentage_loss
            else:
                base_history = h_prev or h_next
                if base_history is None:
                    raise LogicError("Aucun historique trouvé pour un import d'ingrédient")
                quantity_reference = (
                    _as_decimal(_safe_get(h_prev, "quantity"))
                    or _as_decimal(_safe_get(h_next, "quantity"))
                    or quantity_reference
                )
                percentage_loss = (
                    _as_decimal(_safe_get(h_prev, "percentage_loss"))
                    or _as_decimal(_safe_get(h_next, "percentage_loss"))
                    or percentage_loss
                )
                unit = _safe_get(base_history, "unit") or unit

            unit_cost, _, loss_value = _compute_loss_and_cost(
                gross_unit_price,
                quantity_reference,
                percentage_loss,
            )
            portion = _portion_for_recipe(recipe_id)
            unit_cost_per_portion_recipe = unit_cost / portion

            if same_day_history:
                history_payload = {
                    "gross_unit_price": gross_unit_price,
                    "quantity": quantity_reference,
                    "percentage_loss": percentage_loss,
                    "unit_cost": unit_cost,
                    "loss_value": loss_value,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                    "unit": _safe_get(base_history, "unit") or _safe_get(ingredient, "unit"),
                }
                history_ingredients_service.update_history_ingredients(
                    _safe_get(same_day_history, "id"), history_payload
                )
            else:
                prev_version = _as_decimal(_safe_get(h_prev, "version_number"))
                next_version = _as_decimal(_safe_get(h_next, "version_number"))
                base_is_prev = base_history is h_prev
                version_number = _compute_import_version(prev_version, next_version, base_is_prev)

                history_payload = {
                    "ingredient_id": ingredient_id,
                    "recipe_id": recipe_id,
                    "establishment_id": establishment_id,
                    "master_article_id": master_article_id,
                    "unit": unit,
                    "quantity": quantity_reference,
                    "percentage_loss": percentage_loss,
                    "gross_unit_price": gross_unit_price,
                    "unit_cost": unit_cost,
                    "loss_value": loss_value,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                    "date": datetime.combine(target_date_norm, time()),
                    "version_number": version_number,
                }
                history_ingredients_service.create_history_ingredients(history_payload)

            latest_histories = _get_histories(ingredient_id)
            if latest_histories:
                _update_ingredient_from_history(ingredient, latest_histories[-1])

            if recipe_id:
                recipes_directly_impacted.add(recipe_id)
            ingredients_processed.add(ingredient_id)

    # --------------------------------------------------------
    # ARTICLE – manual
    # --------------------------------------------------------
    if trigger == "manual":
        for ingredient in ingredients_article:
            ingredient_id = _safe_get(ingredient, "id")
            recipe_id = _safe_get(ingredient, "recipe_id")
            histories = _get_histories(ingredient_id)
            if not histories:
                articles = articles_service.get_all_articles(
                    filters={
                        "master_article_id": _safe_get(ingredient, "master_article_id"),
                        "order_by": "date",
                        "direction": "desc",
                        "establishment_id": establishment_id,
                    },
                    limit=1,
                )
                if not articles:
                    continue
                article = articles[0]
                gross_unit_price = _as_decimal(_safe_get(article, "unit_price"))
                if gross_unit_price is None:
                    continue
                quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
                percentage_loss = _as_decimal(_safe_get(ingredient, "percentage_loss")) or Decimal("0")
                unit_cost = _as_decimal(_safe_get(ingredient, "unit_cost"))
                if unit_cost is None:
                    unit_cost, _, loss_value = _compute_loss_and_cost(
                        gross_unit_price, quantity, percentage_loss
                    )
                else:
                    _, _, loss_value = _compute_loss_and_cost(
                        gross_unit_price, quantity, percentage_loss
                    )
                unit_cost_per_portion_recipe = _as_decimal(
                    _safe_get(ingredient, "unit_cost_per_portion_recipe")
                )
                if unit_cost_per_portion_recipe is None:
                    portion = _portion_for_recipe(recipe_id)
                    unit_cost_per_portion_recipe = unit_cost / portion
                history_payload = {
                    "ingredient_id": ingredient_id,
                    "recipe_id": recipe_id,
                    "establishment_id": establishment_id,
                    "master_article_id": _safe_get(ingredient, "master_article_id"),
                    "unit": _safe_get(ingredient, "unit"),
                    "quantity": quantity,
                    "percentage_loss": percentage_loss,
                    "gross_unit_price": gross_unit_price,
                    "unit_cost": unit_cost,
                    "loss_value": loss_value,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                    "date": datetime.combine(_as_date(_safe_get(article, "date")) or target_date_norm, time()),
                    "version_number": Decimal("1"),
                }
                history_ingredients_service.create_history_ingredients(history_payload)
            else:
                latest_history = histories[-1]
                gross_unit_price = _as_decimal(_safe_get(ingredient, "gross_unit_price")) or _as_decimal(
                    _safe_get(latest_history, "gross_unit_price")
                )
                if gross_unit_price is None:
                    continue
                quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
                percentage_loss = _as_decimal(_safe_get(ingredient, "percentage_loss")) or Decimal("0")
                unit_cost = _as_decimal(_safe_get(ingredient, "unit_cost"))
                if unit_cost is None:
                    unit_cost, _, loss_value = _compute_loss_and_cost(
                        gross_unit_price, quantity, percentage_loss
                    )
                else:
                    _, _, loss_value = _compute_loss_and_cost(
                        gross_unit_price, quantity, percentage_loss
                    )
                unit_cost_per_portion_recipe = _as_decimal(
                    _safe_get(ingredient, "unit_cost_per_portion_recipe")
                )
                if unit_cost_per_portion_recipe is None:
                    portion = _portion_for_recipe(recipe_id)
                    unit_cost_per_portion_recipe = unit_cost / portion
                history_payload = {
                    "gross_unit_price": gross_unit_price,
                    "quantity": quantity,
                    "percentage_loss": percentage_loss,
                    "unit_cost": unit_cost,
                    "loss_value": loss_value,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                    "unit": _safe_get(ingredient, "unit"),
                }
                current_version = _as_decimal(_safe_get(latest_history, "version_number"))
                if current_version is not None and current_version != current_version.to_integral_value():
                    history_payload["version_number"] = _compute_manual_version(histories)
                history_ingredients_service.update_history_ingredients(
                    _safe_get(latest_history, "id"), history_payload
                )

            latest_histories = _get_histories(ingredient_id)
            if latest_histories:
                _update_ingredient_from_history(ingredient, latest_histories[-1])

            if recipe_id:
                recipes_directly_impacted.add(recipe_id)
            ingredients_processed.add(ingredient_id)

    # --------------------------------------------------------
    # SUBRECIPE – import
    # --------------------------------------------------------
    if trigger == "import":
        for ingredient in ingredients_subrecipes:
            ingredient_id = _safe_get(ingredient, "id")
            recipe_id = _safe_get(ingredient, "recipe_id")
            subrecipe_id = _safe_get(ingredient, "subrecipe_id")

            subrecipe = _get_recipe(subrecipe_id)
            purchase_cost_per_portion = _as_decimal(
                _safe_get(subrecipe, "purchase_cost_per_portion")
            )
            if purchase_cost_per_portion is None:
                continue
            quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
            gross_unit_price = purchase_cost_per_portion
            unit_cost = gross_unit_price * quantity
            histories = _get_histories(ingredient_id)
            future_histories = [
                h
                for h in histories
                if (_as_date(_safe_get(h, "date")) or date.min) > target_date_norm
            ]
            portion_recipe = _portion_for_recipe(recipe_id)
            unit_cost_per_portion_recipe = unit_cost / portion_recipe

            if not future_histories:
                if histories:
                    last_version = _as_decimal(_safe_get(histories[-1], "version_number")) or Decimal("0")
                    version_number = last_version + Decimal("0.01")
                else:
                    version_number = Decimal("1")
                history_payload = {
                    "ingredient_id": ingredient_id,
                    "recipe_id": recipe_id,
                    "establishment_id": establishment_id,
                    "subrecipe_id": subrecipe_id,
                    "quantity": quantity,
                    "gross_unit_price": gross_unit_price,
                    "unit_cost": unit_cost,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                    "date": datetime.combine(target_date_norm, time()),
                    "version_number": version_number,
                }
                history_ingredients_service.create_history_ingredients(history_payload)
            else:
                future_histories_sorted = sorted(
                    future_histories,
                    key=lambda h: _as_date(_safe_get(h, "date")) or date.min,
                    reverse=True,
                )
                target_history = future_histories_sorted[0]
                history_payload = {
                    "gross_unit_price": gross_unit_price,
                    "unit_cost": unit_cost,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                }
                history_ingredients_service.update_history_ingredients(
                    _safe_get(target_history, "id"), history_payload
                )

            ingredient_payload = {
                "gross_unit_price": gross_unit_price,
                "unit_cost": unit_cost,
                "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                "quantity": quantity,
            }
            ingredients_service.update_ingredients(ingredient_id, ingredient_payload)
            if recipe_id:
                recipes_indirectly_impacted.add(recipe_id)
            ingredients_processed.add(ingredient_id)

    # --------------------------------------------------------
    # SUBRECIPE – manual
    # --------------------------------------------------------
    if trigger == "manual":
        for ingredient in ingredients_subrecipes:
            ingredient_id = _safe_get(ingredient, "id")
            recipe_id = _safe_get(ingredient, "recipe_id")
            subrecipe_id = _safe_get(ingredient, "subrecipe_id")

            history_recipe_filters = {
                "recipe_id": subrecipe_id,
                "establishment_id": establishment_id,
                "order_by": "date",
                "direction": "asc",
            }
            subrecipe_histories = history_recipes_service.get_all_history_recipes(
                filters=history_recipe_filters,
                limit=1000,
            )
            last_history_recipe = subrecipe_histories[-1] if subrecipe_histories else None
            if last_history_recipe is None:
                continue

            histories = _get_histories(ingredient_id)
            gross_unit_price = _as_decimal(_safe_get(last_history_recipe, "purchase_cost_per_portion"))
            if gross_unit_price is None:
                continue
            quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
            unit_cost = gross_unit_price * quantity
            portion_recipe = _portion_for_recipe(recipe_id)
            unit_cost_per_portion_recipe = unit_cost / portion_recipe

            if not histories:
                history_payload = {
                    "ingredient_id": ingredient_id,
                    "recipe_id": recipe_id,
                    "establishment_id": establishment_id,
                    "subrecipe_id": subrecipe_id,
                    "quantity": quantity,
                    "gross_unit_price": gross_unit_price,
                    "unit_cost": unit_cost,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                    "date": datetime.combine(
                        _as_date(_safe_get(last_history_recipe, "date")) or target_date_norm, time()
                    ),
                    "version_number": Decimal("1"),
                }
                history_ingredients_service.create_history_ingredients(history_payload)
            else:
                latest_history = histories[-1]
                history_payload = {
                    "gross_unit_price": _as_decimal(_safe_get(ingredient, "gross_unit_price"))
                    or gross_unit_price,
                    "quantity": quantity,
                    "unit_cost": _as_decimal(_safe_get(ingredient, "unit_cost")) or unit_cost,
                    "unit_cost_per_portion_recipe": _as_decimal(
                        _safe_get(ingredient, "unit_cost_per_portion_recipe")
                    )
                    or unit_cost_per_portion_recipe,
                }
                current_version = _as_decimal(_safe_get(latest_history, "version_number"))
                if current_version is not None and current_version != current_version.to_integral_value():
                    history_payload["version_number"] = _compute_manual_version(histories)
                history_ingredients_service.update_history_ingredients(
                    _safe_get(latest_history, "id"), history_payload
                )

            if recipe_id:
                recipes_indirectly_impacted.add(recipe_id)
            ingredients_processed.add(ingredient_id)

    # --------------------------------------------------------
    # FIXED – manual uniquement
    # --------------------------------------------------------
    if trigger == "manual":
        for ingredient in ingredients_fixed:
            ingredient_id = _safe_get(ingredient, "id")
            recipe_id = _safe_get(ingredient, "recipe_id")
            histories = _get_histories(ingredient_id)
            now_dt = datetime.combine(target_date_norm, time())
            same_day_history, _, _ = _split_histories(histories, target_date_norm)

            if same_day_history is None:
                if histories:
                    version_number = _compute_manual_version(histories)
                else:
                    version_number = Decimal("1")
                history_payload = {
                    "ingredient_id": ingredient_id,
                    "recipe_id": recipe_id,
                    "establishment_id": establishment_id,
                    "unit_cost": _as_decimal(_safe_get(ingredient, "unit_cost")),
                    "date": now_dt,
                    "version_number": version_number,
                }
                history_ingredients_service.create_history_ingredients(history_payload)
            else:
                history_ingredients_service.update_history_ingredients(
                    _safe_get(same_day_history, "id"),
                    {"unit_cost": _as_decimal(_safe_get(ingredient, "unit_cost"))},
                )

            if recipe_id:
                recipes_directly_impacted.add(recipe_id)
            ingredients_processed.add(ingredient_id)

    return {
        "recipes_directly_impacted": recipes_directly_impacted,
        "recipes_indirectly_impacted": recipes_indirectly_impacted,
        "ingredients_processed": ingredients_processed,
    }
