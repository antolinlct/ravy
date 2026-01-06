# UTILISER POUR CALCULER/METTRE A JOUR L'ENSEMBLE DES INGREDIENT ET HISTORY_INGREDIENTS

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple
from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.core.supabase_client import supabase
from app.logic.write.shared.recipes_history_recipes import update_recipes_and_history_recipes
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


def _ensure_portion(recipe_id: Optional[UUID], portion: Optional[Decimal]) -> Decimal:
     # Si aucune portion n'est spécifiée, la règle métier RAVY = 1 portion
    if portion is None or portion == 0:
        return Decimal("1")
    return portion


def _split_histories(
    histories: Iterable[Any], target_date: date
) -> Tuple[Optional[Any], Optional[Any], Optional[Any]]:
    same_day = None
    h_prev = None
    h_next = None

    for history in histories:
        history_date = _as_date(_safe_get(history, "date"))
        if history_date is None:
            continue
        # priorité absolue : si même date, on stoppe tout
        if history_date == target_date:
            same_day = history
            return same_day, None, None
        if history_date < target_date:
            h_prev = history
        elif history_date > target_date and h_next is None:
            h_next = history
    return same_day, h_prev, h_next


def _chunked(values: Sequence[str], size: int = 500) -> Iterable[List[str]]:
    for idx in range(0, len(values), size):
        yield list(values[idx : idx + size])


def _compute_loss_and_cost(
    gross_unit_price: Decimal, quantity: Decimal, percentage_loss: Optional[Decimal]
) -> Tuple[Decimal, Decimal, Optional[Decimal]]:
    loss_multiplier = Decimal("1")
    if percentage_loss is not None:
        loss_multiplier += percentage_loss / Decimal("100") # = 1 + (percentage_loss/100)
    gross_total = gross_unit_price * quantity
    unit_cost = gross_total * loss_multiplier
    loss_value = unit_cost - gross_total if percentage_loss is not None and percentage_loss > 0 else None
    return unit_cost, gross_total, loss_value

# UTILE POUR DEFINIR LES VERSION_NUMBER ENTIER
def _compute_manual_version(histories: Sequence[Any]) -> Decimal:
    """
    À partir d'une liste d'historique, retourne le prochain entier supérieur
    basé sur la version_number du plus récent.
    """
    if not histories:
        return Decimal("1")

    latest = histories[-1]
    current_version = _as_decimal(_safe_get(latest, "version_number"))

    if current_version is None:
        return Decimal("1")

    base_integer = current_version.to_integral_value()
    return base_integer + Decimal("1")



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

    target_date_norm = _as_date(target_date) or date.today() # prend la date fournis ou par défaut la date du jour arrondis au jour.
    establishment_id_str = str(establishment_id)

    ingredient_ids_set = {str(iid) for iid in ingredient_ids}

    # Précharger tous les ingrédients concernés en un minimum d'appels
    ingredients_by_id: Dict[str, Any] = {}
    if ingredient_ids_set:
        for chunk in _chunked(sorted(ingredient_ids_set)):
            response = (
                supabase.table("ingredients")
                .select("*")
                .in_("id", chunk)
                .eq("establishment_id", establishment_id_str)
                .execute()
            )
            for row in response.data or []:
                ingredients_by_id[str(row.get("id"))] = row

    # Précharger tous les historiques d'ingrédients
    histories_by_ingredient_id: Dict[str, List[Any]] = {iid: [] for iid in ingredient_ids_set}
    if ingredient_ids_set:
        for chunk in _chunked(sorted(ingredient_ids_set)):
            response = (
                supabase.table("history_ingredients")
                .select("*")
                .in_("ingredient_id", chunk)
                .eq("establishment_id", establishment_id_str)
                .order("date", desc=False)
                .execute()
            )
            for row in response.data or []:
                histories_by_ingredient_id.setdefault(str(row.get("ingredient_id")), []).append(row)

    def _sort_histories(histories: List[Any]) -> None:
        histories.sort(key=lambda h: _as_date(_safe_get(h, "date")) or date.min)

    # VA CHERCHER LES HISTORIQUE D'UN INGREDIENT
    def _get_histories(ingredient_id: UUID) -> List[Any]:
        return histories_by_ingredient_id.get(str(ingredient_id), [])

    def _upsert_history_cache(ingredient_id: UUID, history_row: Any) -> None:
        if not history_row:
            return
        key = str(ingredient_id)
        histories = histories_by_ingredient_id.setdefault(key, [])
        history_id = _safe_get(history_row, "id")
        if history_id is not None:
            for idx, existing in enumerate(histories):
                if _safe_get(existing, "id") == history_id:
                    histories[idx] = history_row
                    _sort_histories(histories)
                    return
        histories.append(history_row)
        _sort_histories(histories)

    pending_history_inserts: List[Dict[str, Any]] = []

    def _flush_pending_history_inserts() -> None:
        if not pending_history_inserts:
            return
        prepared = jsonable_encoder(
            [
                {k: v for k, v in payload.items() if v is not None and k != "id"}
                for payload in pending_history_inserts
            ]
        )
        try:
            response = supabase.table("history_ingredients").insert(prepared).execute()
            for row in response.data or []:
                ingredient_ref = _safe_get(row, "ingredient_id")
                if ingredient_ref:
                    _upsert_history_cache(ingredient_ref, row)
        except Exception:
            for payload in pending_history_inserts:
                created = history_ingredients_service.create_history_ingredients(payload)
                if created:
                    _upsert_history_cache(_safe_get(payload, "ingredient_id"), created)
        finally:
            pending_history_inserts.clear()

    # VA CHERCHER LE NOMBRE DE PORTION DE LA RECETTE DE L'INGREDIENT, L'ENVOIE A _ENSURE_PORTION ET RETOURNE 1 SI VIDE AVEC ERREUR.
    def _portion_for_recipe(recipe_id: Optional[UUID]) -> Decimal:
        recipe = _get_recipe(recipe_id)
        if recipe is None:
            raise LogicError("Recette introuvable pour un ingredient dépendant d'une recipe")
        return _ensure_portion(recipe_id, _as_decimal(_safe_get(recipe, "portion")))

    def _update_ingredient_from_history(ingredient: Any, history: Any) -> None:
        ingredient_payload = {
            "gross_unit_price": _as_decimal(_safe_get(history, "gross_unit_price")),
            "unit_cost": _as_decimal(_safe_get(history, "unit_cost")),
            "unit_cost_per_portion_recipe": _as_decimal(_safe_get(history, "unit_cost_per_portion_recipe")),
            "percentage_loss": _as_decimal(_safe_get(history, "percentage_loss")),
            "loss_value": _as_decimal(_safe_get(history, "loss_value")),
            "quantity": _as_decimal(_safe_get(history, "quantity")),
        }
        ingredients_service.update_ingredients(_safe_get(ingredient, "id"), ingredient_payload)

    # Chargement des ingrédients concernés
    ingredients: List[Any] = []
    for iid in ingredient_ids_set: # Définitions des ingredients a travailler, on enlève les doubons.
        ingredient = ingredients_by_id.get(str(iid))
        if ingredient and _safe_get(ingredient, "establishment_id") == establishment_id_str:
            ingredients.append(ingredient)

    ingredients_article = [ # Définitions des ingredients lot 1 type ARTICLE
        ing
        for ing in ingredients
        if _safe_get(ing, "type") == "ARTICLE" and _safe_get(ing, "master_article_id") is not None
    ]
    ingredients_subrecipes = [ # Définitions des ingredients lot 2 type SUBRECIPES
        ing
        for ing in ingredients
        if _safe_get(ing, "type") == "SUBRECIPE" and _safe_get(ing, "subrecipe_id") is not None
    ]
    ingredients_fixed = [ing for ing in ingredients if _safe_get(ing, "type") == "FIXED"] # Définitions des ingredients lot 3 type FIXED

    recipes_cache: Dict[UUID, Any] = {}
    subrecipe_histories_cache: Dict[str, List[Any]] = {}

    def _get_recipe(recipe_id: Optional[UUID]) -> Optional[Any]:
        if recipe_id is None:
            return None
        if recipe_id not in recipes_cache:
            recipes_cache[recipe_id] = recipes_service.get_recipes_by_id(recipe_id)
        recipe = recipes_cache.get(recipe_id)
        if _safe_get(recipe, "establishment_id") != establishment_id:
            return None
        return recipe

    if trigger == "manual" and ingredients_subrecipes:
        subrecipe_ids = {
            str(_safe_get(ing, "subrecipe_id"))
            for ing in ingredients_subrecipes
            if _safe_get(ing, "subrecipe_id") is not None
        }
        for chunk in _chunked(sorted(subrecipe_ids)):
            response = (
                supabase.table("history_recipes")
                .select("*")
                .in_("recipe_id", chunk)
                .eq("establishment_id", establishment_id_str)
                .order("date", desc=False)
                .execute()
            )
            for row in response.data or []:
                subrecipe_histories_cache.setdefault(str(row.get("recipe_id")), []).append(row)
        for histories in subrecipe_histories_cache.values():
            histories.sort(key=lambda h: _as_date(_safe_get(h, "date")) or date.min)

    recipes_directly_impacted: Set[UUID] = set()
    recipes_indirectly_impacted: Set[UUID] = set()
    ingredients_processed: Set[UUID] = set()

    articles_by_master_id: Dict[str, Any] = {}
    if trigger == "import" and invoice_id and ingredients_article:
        master_ids = {
            str(_safe_get(ing, "master_article_id"))
            for ing in ingredients_article
            if _safe_get(ing, "master_article_id") is not None
        }
        for chunk in _chunked(sorted(master_ids)):
            response = (
                supabase.table("articles")
                .select("id, unit_price, date, master_article_id")
                .eq("invoice_id", str(invoice_id))
                .eq("establishment_id", establishment_id_str)
                .in_("master_article_id", chunk)
                .order("date", desc=True)
                .execute()
            )
            for row in response.data or []:
                master_id = str(row.get("master_article_id"))
                if master_id and master_id not in articles_by_master_id:
                    articles_by_master_id[master_id] = row

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

            article = articles_by_master_id.get(str(master_article_id))
            if not article:
                continue

            gross_unit_price = _as_decimal(_safe_get(article, "unit_price"))
            if gross_unit_price is None:
                continue

            histories = _get_histories(ingredient_id)
            same_day_history, h_prev, h_next = _split_histories(histories, target_date_norm)

            # base pour récupérer quantité / perte / unité
            if same_day_history:
                base_history = same_day_history
            elif h_prev:
                base_history = h_prev
            elif h_next:
                base_history = h_next
            else:
                # aucun historique pour cet ingrédient alors qu'on importe une facture
                raise LogicError("Aucun historique trouvé pour un import d'ingrédient")

            quantity_reference = _as_decimal(_safe_get(base_history, "quantity"))
            if quantity_reference is None:
                quantity_reference = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")

            percentage_loss = _as_decimal(_safe_get(base_history, "percentage_loss"))
            if percentage_loss is None:
                percentage_loss = _as_decimal(_safe_get(ingredient, "percentage_loss")) or Decimal("0")

            unit = _safe_get(base_history, "unit") or _safe_get(ingredient, "unit")

            unit_cost, _, loss_value = _compute_loss_and_cost(
                gross_unit_price, quantity_reference, percentage_loss
            )
            portion = _portion_for_recipe(recipe_id)
            unit_cost_per_portion_recipe = unit_cost / portion

            history_for_update = None
            if same_day_history:
                # même date : on met à jour l'historique existant, pas de nouvelle ligne
                history_payload = {
                    "gross_unit_price": gross_unit_price,
                    "quantity": quantity_reference,
                    "percentage_loss": percentage_loss,
                    "unit_cost": unit_cost,
                    "loss_value": loss_value,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                    "unit": unit,
                }
                updated = history_ingredients_service.update_history_ingredients(
                    _safe_get(same_day_history, "id"), history_payload
                )
                _upsert_history_cache(ingredient_id, updated or same_day_history)
                history_for_update = updated or same_day_history
            else:
                # pas d'historique ce jour-là : on crée une nouvelle entrée avec version décimale
                prev_version = _as_decimal(_safe_get(h_prev, "version_number")) if h_prev else None
                next_version = _as_decimal(_safe_get(h_next, "version_number")) if h_next else None

                if prev_version is not None and next_version is None:
                    # basé sur h_prev
                    version_number = prev_version + Decimal("0.01")
                elif prev_version is None and next_version is not None:
                    # basé sur h_next
                    version_number = next_version - Decimal("0.01")
                elif prev_version is not None and next_version is not None:
                    # facture entre deux historiques → basé sur h_prev
                    version_number = prev_version + Decimal("0.01")
                else:
                    # on a des historiques mais pas de prev/next cohérent
                    raise LogicError("Impossible de déterminer la version_number pour cet import")

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
                    "source_article_id": _safe_get(article, "id"),
                }
                pending_history_inserts.append(history_payload)
                history_for_update = history_payload

            if history_for_update:
                _update_ingredient_from_history(ingredient, history_for_update)

            if recipe_id:
                recipes_directly_impacted.add(recipe_id)
            ingredients_processed.add(ingredient_id)


    # --------------------------------------------------------
    # ARTICLE – manual (logique unifiée)
    # --------------------------------------------------------
    if trigger == "manual":
        for ingredient in ingredients_article:
            ingredient_id = _safe_get(ingredient, "id")
            recipe_id = _safe_get(ingredient, "recipe_id")
            master_article_id = _safe_get(ingredient, "master_article_id")

            # sécurités minimales
            if master_article_id is None:
                continue

            # 1) récupérer les derniers articles du master_article
            articles = articles_service.get_all_articles(
                filters={
                    "master_article_id": master_article_id,
                    "order_by": "date",
                    "direction": "desc",
                    "establishment_id": establishment_id,
                },
                limit=5,
            )
            if not articles:
                continue

            # 2) sélectionner le dernier article avec prix valide
            last_article = None
            last_price = None

            for art in articles:
                price = _as_decimal(_safe_get(art, "unit_price"))
                if price is not None and price > 0:
                    last_article = art
                    last_price = price
                    break

            if last_article is None:
                continue

            # date de référence de l'historique = date du dernier article
            article_date = _as_date(_safe_get(last_article, "date")) or target_date_norm
            history_dt = datetime.combine(article_date, time())

            # 3) re-calcul des coûts depuis les valeurs de l'ingrédient
            quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
            percentage_loss = _as_decimal(_safe_get(ingredient, "percentage_loss")) or Decimal("0")

            unit_cost, _, loss_value = _compute_loss_and_cost(last_price, quantity, percentage_loss)

            portion = _portion_for_recipe(recipe_id)
            unit_cost_per_portion_recipe = unit_cost / portion

            # 4) vérifier s'il existe déjà un historique à cette date
            histories = _get_histories(ingredient_id)
            same_day_history, _, _ = _split_histories(histories, article_date)

            history_payload = {
                "gross_unit_price": last_price,
                "quantity": quantity,
                "percentage_loss": percentage_loss,
                "unit_cost": unit_cost,
                "loss_value": loss_value,
                "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                "unit": _safe_get(ingredient, "unit"),
                "source_article_id": _safe_get(last_article, "id"),
            }

            if same_day_history:
                # 5) UPDATE si même date
                current_version = _as_decimal(_safe_get(same_day_history, "version_number"))
                if current_version is not None and current_version != current_version.to_integral_value():
                    history_payload["version_number"] = _compute_manual_version(histories)

                updated = history_ingredients_service.update_history_ingredients(
                    _safe_get(same_day_history, "id"), 
                    history_payload
                )
                _upsert_history_cache(ingredient_id, updated or same_day_history)

            else:
                # 6) CREATE sinon → version entière suivante
                version_number = _compute_manual_version(histories)

                history_payload_full = {
                    "ingredient_id": ingredient_id,
                    "recipe_id": recipe_id,
                    "establishment_id": establishment_id,
                    "master_article_id": master_article_id,
                    "date": history_dt,
                    "version_number": version_number,
                    **history_payload,
                }

                created = history_ingredients_service.create_history_ingredients(history_payload_full)
                _upsert_history_cache(ingredient_id, created or history_payload_full)

            # 7) mettre à jour l'ingrédient avec le dernier historique
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
            purchase_cost_per_portion = _as_decimal(_safe_get(subrecipe, "purchase_cost_per_portion"))

            if purchase_cost_per_portion is None:
                continue

            quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
            gross_unit_price = purchase_cost_per_portion
            unit_cost = gross_unit_price * quantity
            
            histories = _get_histories(ingredient_id)
            future_histories = [ h for h in histories
                if (_as_date(_safe_get(h, "date")) or date.min) > target_date_norm ]
            
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
                pending_history_inserts.append(history_payload)
            else:
                future_histories_sorted = sorted(
                    future_histories,
                    key=lambda h: _as_date(_safe_get(h, "date")) or date.min,
                    reverse=True,)
                
                target_history = future_histories_sorted[0]
                history_payload = {
                    "gross_unit_price": gross_unit_price,
                    "unit_cost": unit_cost,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                }
                updated = history_ingredients_service.update_history_ingredients(_safe_get(target_history, "id"), history_payload)
                _upsert_history_cache(ingredient_id, updated or target_history)

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
            subrecipe_histories = subrecipe_histories_cache.get(str(subrecipe_id))
            if subrecipe_histories is None:
                subrecipe_histories = history_recipes_service.get_all_history_recipes(
                    filters=history_recipe_filters,
                    limit=1000,
                )
            last_history_subrecipe = subrecipe_histories[-1] if subrecipe_histories else None # Recherche d'historique recette dans la sous-recette
            gross_unit_price = _as_decimal(_safe_get(last_history_subrecipe, "purchase_cost_per_portion"))
            if last_history_subrecipe is None or gross_unit_price is None:
                update_recipes_and_history_recipes(
                    establishment_id=establishment_id,
                    recipe_ids=[subrecipe_id],
                    target_date=target_date_norm,
                    trigger="manual",
                )
                subrecipe_histories = history_recipes_service.get_all_history_recipes(
                    filters=history_recipe_filters,
                    limit=1000,
                )
                last_history_subrecipe = subrecipe_histories[-1] if subrecipe_histories else None
                gross_unit_price = _as_decimal(
                    _safe_get(last_history_subrecipe, "purchase_cost_per_portion")
                )
            if last_history_subrecipe is None or gross_unit_price is None:
                continue

            histories = _get_histories(ingredient_id)
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
                    "date": datetime.combine( _as_date(_safe_get(last_history_subrecipe, "date")) or target_date_norm, time()),
                    "version_number": Decimal("1"),
                }
                created = history_ingredients_service.create_history_ingredients(history_payload)
                _upsert_history_cache(ingredient_id, created or history_payload)
            else:
                latest_history = histories[-1]

                history_payload = {
                    "gross_unit_price": gross_unit_price,
                    "quantity": quantity,
                    "unit_cost": unit_cost,
                    "unit_cost_per_portion_recipe": unit_cost_per_portion_recipe,
                }

                current_version = _as_decimal(_safe_get(latest_history, "version_number"))

                if current_version is not None and current_version != current_version.to_integral_value():
                    history_payload["version_number"] = _compute_manual_version(histories)
                
                updated = history_ingredients_service.update_history_ingredients(_safe_get(latest_history, "id"), history_payload)
                _upsert_history_cache(ingredient_id, updated or latest_history)

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
                    "gross_unit_price": _as_decimal(_safe_get(ingredient, "gross_unit_price")),
                    "unit_cost": _as_decimal(_safe_get(ingredient, "unit_cost")),
                    "date": now_dt,
                    "version_number": version_number,
                }
                created = history_ingredients_service.create_history_ingredients(history_payload)
                _upsert_history_cache(ingredient_id, created or history_payload)
            else:
                updated = history_ingredients_service.update_history_ingredients(
                    _safe_get(same_day_history, "id"),
                    {"unit_cost": _as_decimal(_safe_get(ingredient, "unit_cost"))},
                )
                _upsert_history_cache(ingredient_id, updated or same_day_history)

            if recipe_id:
                recipes_directly_impacted.add(recipe_id)
            ingredients_processed.add(ingredient_id)

    if trigger == "import":
        _flush_pending_history_inserts()

    return {
        "recipes_directly_impacted": recipes_directly_impacted,
        "recipes_indirectly_impacted": recipes_indirectly_impacted,
        "ingredients_processed": ingredients_processed,
    }
