# UTILISER POUR CALCULER/METTRE A JOUR L'ENSEMBLE DES MARGES MOYENNES
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence
from uuid import UUID

from app.services import (
    recipes_service,
    recipe_margin_service,
    recipe_margin_category_service,
    recipe_margin_subcategory_service,
    recipe_categories_service,
    recipes_subcategories_service,
    establishments_service,
    logs_service,
)

# ============================================================
#                     UTILITAIRES
# ============================================================


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _unique(values: Iterable[Any]) -> List[Any]:
    return list({v for v in values if v is not None})


def _normalize_to_date(value: Any) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value).date()
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


def _mean(values: Sequence[Decimal]) -> Optional[Decimal]:
    usable = [v for v in values if v is not None]
    if not usable:
        return None
    return sum(usable) / Decimal(len(usable))


def _upsert_margin(
    service_get,
    service_create,
    service_update,
    base_filters: Dict[str, Any],
    avg_margin: Optional[Decimal],
    target_date: date,
) -> Dict[str, Any]:
    """
    Upsert exact RAVY :
    - date arrondie au jour
    - si date existante >= target_date → update le + récent
    - sinon → insert
    """

    if avg_margin is None:
        return {"updated": False, "created": False, "id": None}

    target_date_norm = _normalize_to_date(target_date)
    filters = {**base_filters, "order_by": "date", "direction": "desc"}

    existing_list = service_get(filters=filters, limit=1)

    create_payload = {
        **base_filters,
        "average_margin": avg_margin,
        "date": target_date_norm,
    }
    update_payload = {
        **base_filters,
        "average_margin": avg_margin,
    }

    if existing_list:
        existing = existing_list[0]
        existing_date = _normalize_to_date(_safe_get(existing, "date"))
        if existing_date and existing_date >= target_date_norm:
            existing_id = _safe_get(existing, "id")
            service_update(existing_id, update_payload)
            return {"updated": True, "created": False, "id": existing_id}

    created = service_create(create_payload)
    return {"updated": False, "created": True, "id": _safe_get(created, "id")}


# ============================================================
#                FONCTION PRINCIPALE
# ============================================================

def recompute_recipe_margins(
    establishment_id: UUID,
    recipe_ids: Sequence[UUID],
    target_date: date | datetime,
) -> Dict[str, Any]:

    # Normalisation date
    target_date_norm = _normalize_to_date(target_date)

    # Récupération du nom établissement
    est = establishments_service.get_establishments_by_id(establishment_id)
    est_name = _safe_get(est, "name", "Établissement inconnu")

    # LOG — Début
    logs_service.create_logs(
        {
            "user_id": None,
            "establishment_id": establishment_id,
            "type": "context",
            "action": None,
            "text": f"Début du recalcul des marges moyennes – {est_name}",
            "json": {
                "domain": "recipes",
                "scope": "recompute_margins/start",
                "recipe_ids": [str(r) for r in recipe_ids],
                "target_date": str(target_date_norm),
            },
            "element_id": None,
            "element_type": "recipe",
        }
    )

    # -----------------------------------------------------------
    #   1) Chargement des recettes
    # -----------------------------------------------------------
    recipes = recipes_service.get_all_recipes(
        filters={"establishment_id": establishment_id}
    )

    recipes_by_id = { _safe_get(r, "id"): r for r in recipes }

    valid_recipes = [
        r for r in recipes_by_id.values()
        if _safe_get(r, "saleable") and _safe_get(r, "active")
    ]

    impacted_valid = [
        recipes_by_id[rid]
        for rid in recipe_ids
        if rid in recipes_by_id
        and _safe_get(recipes_by_id[rid], "saleable")
        and _safe_get(recipes_by_id[rid], "active")
    ]

    # -----------------------------------------------------------
    #   2) Marge globale
    # -----------------------------------------------------------
    global_margins = []
    for r in valid_recipes:
        m = _as_decimal(_safe_get(r, "current_margin")) or Decimal("0")
        global_margins.append(m)

    avg_global = _mean(global_margins)

    global_res = _upsert_margin(
        recipe_margin_service.get_all_recipe_margin,
        recipe_margin_service.create_recipe_margin,
        recipe_margin_service.update_recipe_margin,
        {"establishment_id": establishment_id},
        avg_global,
        target_date_norm,
    )

    logs_service.create_logs(
        {
            "user_id": None,
            "establishment_id": establishment_id,
            "type": "job",
            "action": "create" if global_res["created"] else "update",
            "text": (
                f"Marge moyenne globale recalculée – "
                f"{float(avg_global):.2f}% – {est_name}"
                if avg_global is not None else
                f"Marge moyenne globale recalculée – {est_name}"
            ),
            "json": {
                "domain": "recipes",
                "scope": "recompute_margins/global",
                "average_margin": float(avg_global) if avg_global else None,
            },
            "element_id": global_res["id"],
            "element_type": "recipe",
        }
    )

    # -----------------------------------------------------------
    #   3) Catégories
    # -----------------------------------------------------------
    categories_result = []

    category_ids = _unique(
        _safe_get(r, "category_id")
        for r in impacted_valid
        if _safe_get(r, "category_id")
    )

    for cat_id in category_ids:

        recipes_in_cat = [
            r for r in valid_recipes if _safe_get(r, "category_id") == cat_id
        ]
        if not recipes_in_cat:
            continue

        margins = [
            _as_decimal(_safe_get(r, "current_margin")) or Decimal("0")
            for r in recipes_in_cat
        ]
        avg_cat = _mean(margins)

        res_cat = _upsert_margin(
            recipe_margin_category_service.get_all_recipe_margin_category,
            recipe_margin_category_service.create_recipe_margin_category,
            recipe_margin_category_service.update_recipe_margin_category,
            {
                "establishment_id": establishment_id,
                "category_id": cat_id,
            },
            avg_cat,
            target_date_norm,
        )

        cat_obj = recipe_categories_service.get_recipe_categories_by_id(cat_id)
        cat_name = _safe_get(cat_obj, "name", "Sans nom")

        logs_service.create_logs(
            {
                "user_id": None,
                "establishment_id": establishment_id,
                "type": "job",
                "action": "create" if res_cat["created"] else "update",
                "text": (
                    f"Marge moyenne catégorie {cat_name} recalculée – "
                    f"{float(avg_cat):.2f}% – {est_name}"
                    if avg_cat is not None else
                    f"Marge moyenne catégorie {cat_name} recalculée – {est_name}"
                ),
                "json": {
                    "domain": "recipes",
                    "scope": "recompute_margins/category",
                    "category_id": cat_id,
                    "category_name": cat_name,
                    "average_margin": float(avg_cat) if avg_cat else None,
                },
                "element_id": res_cat["id"],
                "element_type": "recipe",
            }
        )

        categories_result.append(
            {
                "category_id": cat_id,
                "category_name": cat_name,
                "updated": res_cat["updated"],
                "created": res_cat["created"],
            }
        )

    # -----------------------------------------------------------
    #   4) Sous-catégories
    # -----------------------------------------------------------
    subcategories_result = []

    subcat_ids = _unique(
        _safe_get(r, "subcategory_id")
        for r in impacted_valid
        if _safe_get(r, "subcategory_id")
    )

    for sub_id in subcat_ids:

        recipes_in_subcat = [
            r for r in valid_recipes if _safe_get(r, "subcategory_id") == sub_id
        ]
        if not recipes_in_subcat:
            continue

        margins = [
            _as_decimal(_safe_get(r, "current_margin")) or Decimal("0")
            for r in recipes_in_subcat
        ]
        avg_sub = _mean(margins)

        res_sub = _upsert_margin(
            recipe_margin_subcategory_service.get_all_recipe_margin_subcategory,
            recipe_margin_subcategory_service.create_recipe_margin_subcategory,
            recipe_margin_subcategory_service.update_recipe_margin_subcategory,
            {
                "establishment_id": establishment_id,
                "subcategory_id": sub_id,
            },
            avg_sub,
            target_date_norm,
        )

        sub_obj = recipes_subcategories_service.get_recipes_subcategories_by_id(sub_id)
        sub_name = _safe_get(sub_obj, "name", "Sans nom")

        logs_service.create_logs(
            {
                "user_id": None,
                "establishment_id": establishment_id,
                "type": "job",
                "action": "create" if res_sub["created"] else "update",
                "text": (
                    f"Marge moyenne sous-catégorie {sub_name} recalculée – "
                    f"{float(avg_sub):.2f}% – {est_name}"
                    if avg_sub is not None else
                    f"Marge moyenne sous-catégorie {sub_name} recalculée – {est_name}"
                ),
                "json": {
                    "domain": "recipes",
                    "scope": "recompute_margins/subcategory",
                    "subcategory_id": sub_id,
                    "subcategory_name": sub_name,
                    "average_margin": float(avg_sub) if avg_sub else None,
                },
                "element_id": res_sub["id"],
                "element_type": "recipe",
            }
        )

        subcategories_result.append(
            {
                "subcategory_id": sub_id,
                "subcategory_name": sub_name,
                "updated": res_sub["updated"],
                "created": res_sub["created"],
            }
        )

    # -----------------------------------------------------------
    #   LOG — Fin
    # -----------------------------------------------------------

    logs_service.create_logs(
        {
            "user_id": None,
            "establishment_id": establishment_id,
            "type": "context",
            "action": None,
            "text": f"Fin du recalcul des marges moyennes – {est_name}",
            "json": {
                "domain": "recipes",
                "scope": "recompute_margins/end",
                "categories_recalculated": categories_result,
                "subcategories_recalculated": subcategories_result,
                "global_result": global_res,
            },
            "element_id": None,
            "element_type": "recipe",
        }
    )

    # -----------------------------------------------------------
    #   RETOUR
    # -----------------------------------------------------------

    return {
        "success": True,
        "establishment_id": establishment_id,
        "target_date": target_date_norm,
        "updated": {
            "global": global_res,
            "categories": categories_result,
            "subcategories": subcategories_result,
        },
    }
