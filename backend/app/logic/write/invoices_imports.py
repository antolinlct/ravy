from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple
from uuid import UUID

from app.services import (
    alert_logs_service,
    articles_service,
    establishments_service,
    history_ingredients_service,
    history_recipes_service,
    import_job_service as import_jobs_service,
    ingredients_service,
    invoices_service,
    label_supplier_service,
    market_articles_service,
    market_master_articles_service,
    market_supplier_alias_service,
    market_suppliers_service,
    master_articles_service,
    recipe_margin_category_service,
    recipe_margin_service,
    recipe_margin_subcategory_service,
    recipes_service,
    regex_patterns_service,
    suppliers_service,
    user_establishment_service,
    user_profiles_service,
    variations_service,
)


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE."""


INVOICE_OCR_TEMPLATE: Dict[str, Any] = {
    "invoice": {
        "invoice_number": None,
        "invoice_date": None,
        "due_date": None,
        "currency": "EUR",
        "total_excl_tax": None,
        "total_incl_tax": None,
        "total_vat": None,
        "vat_breakdown": [],
    },
    "supplier": {
        "raw_name": None,
        "vat_number": None,
        "siret": None,
        "contact_email": None,
        "contact_phone": None,
        "street": None,
        "postcode": None,
        "city": None,
        "country_code": None,
    },
    "lines": [],
    "file": {
        "original_filename": None,
        "mime_type": None,
        "page_count": None,
    },
}


@dataclass
class ArticleEntry:
    article_id: Optional[UUID]
    master_article_id: UUID
    unit_price: Optional[Decimal]
    quantity: Optional[Decimal]
    line_total: Optional[Decimal]
    discounts: Optional[Decimal]
    duties: Optional[Decimal]
    date: date


# ---------------------------------------------------------------------------
# Helpers génériques
# ---------------------------------------------------------------------------

def _safe_get(obj: Any, key: str) -> Any:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


def _apply_regex(pattern: Optional[str], value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if not pattern:
        return value.strip()
    import re

    try:
        compiled = re.compile(pattern, flags=re.IGNORECASE)
    except re.error as exc:  # pragma: no cover - defensive
        raise LogicError(f"Regex invalide: {pattern}") from exc
    match = compiled.search(value)
    return match.group(0).strip() if match else value.strip()


def _extract_regex(pattern_type: str) -> Optional[str]:
    patterns = regex_patterns_service.get_all_regex_patterns(
        filters={"type": pattern_type},
        limit=1,
    )
    if not patterns:
        return None
    return _safe_get(patterns[0], "regex")


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


def _decimal_or_zero(value: Optional[Decimal]) -> Decimal:
    return value if value is not None else Decimal("0")


def _decimal_to_float(value: Optional[Decimal]) -> Optional[float]:
    if value is None:
        return None
    return float(value)


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


def _ensure_portion(recipe_id: UUID, portion: Optional[Decimal]) -> Decimal:
    if portion is None or portion == 0:
        raise LogicError(f"Portion nulle pour recipe_id={recipe_id}")
    return portion


def _compute_recipe_cost(ingredients: Iterable[Any]) -> Decimal:
    total = Decimal("0")
    for ingredient in ingredients:
        total += _decimal_or_zero(_as_decimal(_safe_get(ingredient, "unit_cost")))
    return total


def _compute_weighted_unit_price(entries: List[ArticleEntry]) -> Optional[Decimal]:
    if not entries:
        return None
    total_qty = Decimal("0")
    total_value = Decimal("0")
    for entry in entries:
        qty = _decimal_or_zero(entry.quantity)
        line_total = entry.line_total
        if line_total is None and entry.unit_price is not None and qty:
            line_total = entry.unit_price * qty
        discounts = _decimal_or_zero(entry.discounts)
        duties = _decimal_or_zero(entry.duties)
        if line_total is not None:
            total_value += line_total - discounts + duties
        total_qty += qty
    if total_qty <= 0:
        return entries[0].unit_price
    return total_value / total_qty


def _mean(values: Sequence[Decimal]) -> Optional[Decimal]:
    usable = [value for value in values if value is not None]
    if not usable:
        return None
    return sum(usable) / Decimal(len(usable))


def _recommended_price(cost_per_portion: Decimal, establishment: Any) -> Optional[Decimal]:
    method = _safe_get(establishment, "recommended_retail_price_method")
    value = _as_decimal(_safe_get(establishment, "recommended_retail_price_value"))
    if method is None or value is None:
        return None
    if method == "MULTIPLIER":
        return cost_per_portion * value
    if method == "PERCENTAGE":
        return cost_per_portion * (Decimal("1") - (value / Decimal("100")))
    if method == "VALUE":
        return cost_per_portion + value
    return None


def _resolve_supplier_label(supplier: Any, market_supplier: Any) -> Optional[str]:
    label = _safe_get(market_supplier, "label")
    if label:
        return label
    label_id = _safe_get(supplier, "label_id") if supplier else None
    if not label_id:
        return None
    label_entry = label_supplier_service.get_label_supplier_by_id(label_id)
    return _safe_get(label_entry, "label") if label_entry else None


def _history_reference_for_ingredient(ingredient_id: UUID, target_date: date) -> Tuple[Optional[Any], Optional[Any]]:
    histories = history_ingredients_service.get_all_history_ingredients(
        filters={
            "ingredient_id": ingredient_id,
            "order_by": "date",
            "direction": "asc",
        },
        limit=1000,
    )
    h_prev = None
    h_next = None
    for history in histories:
        history_date = _as_date(_safe_get(history, "date"))
        if history_date is None:
            continue
        if history_date <= target_date:
            h_prev = history
        elif history_date > target_date and h_next is None:
            h_next = history
    return h_prev, h_next


def _future_history_recipe(recipe_id: UUID, target_date: date) -> Tuple[Optional[Any], List[Any]]:
    histories = history_recipes_service.get_all_history_recipes(
        filters={
            "recipe_id": recipe_id,
            "order_by": "date",
            "direction": "asc",
        },
        limit=1000,
    )
    future = [hist for hist in histories if (_as_date(_safe_get(hist, "date")) or date.min) > target_date]
    return (future[-1] if future else None), histories


def _unique(sequence: Iterable[UUID]) -> List[UUID]:
    seen: set[UUID] = set()
    ordered: List[UUID] = []
    for item in sequence:
        if item and item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


# ---------------------------------------------------------------------------
# Logique principale
# ---------------------------------------------------------------------------

def import_invoice_from_import_job(import_job_id: UUID) -> None:
    try:
        _import_invoice_from_import_job(import_job_id)
    except Exception:
        import_jobs_service.update_import_job(import_job_id, {"status": "ERROR"})
        raise


def _import_invoice_from_import_job(import_job_id: UUID) -> None:
    import_job = import_jobs_service.get_import_job_by_id(import_job_id)
    if not import_job:
        raise LogicError("Import job introuvable")

    status = (_safe_get(import_job, "status") or "").upper()
    if status in {"COMPLETED", "ERROR"}:
        raise LogicError("Job déjà traité ou en erreur définitive")

    ocr_payload = _safe_get(import_job, "ocr_result_json")
    if not ocr_payload:
        raise LogicError("OCR absent")

    establishment_id = _safe_get(import_job, "establishment_id")
    if not establishment_id:
        raise LogicError("Import job sans établissement")

    establishment = establishments_service.get_establishments_by_id(establishment_id)
    if not establishment:
        raise LogicError("Établissement introuvable")

    invoice_block = ocr_payload.get("invoice") or {}
    supplier_block = ocr_payload.get("supplier") or {}
    lines_block = ocr_payload.get("lines") or []

    invoice_date = _as_date(invoice_block.get("invoice_date"))
    if not invoice_date:
        raise LogicError("Date de facture manquante")

    regex_supplier = _extract_regex("supplier_name")
    regex_master_article = _extract_regex("market_master_article_name")

    raw_supplier_name = supplier_block.get("raw_name")
    cleaned_supplier_name = _apply_regex(regex_supplier, raw_supplier_name) or raw_supplier_name or "Fournisseur"

    market_supplier: Optional[Any] = None
    market_supplier_id: Optional[UUID] = None
    alias = market_supplier_alias_service.get_all_market_supplier_alias(
        filters={"alias": cleaned_supplier_name},
        limit=1,
    )

    if alias:
        market_supplier_id = _safe_get(alias[0], "supplier_market_id")
        if not market_supplier_id:
            raise LogicError("Alias fournisseur sans market_supplier_id")
        market_supplier = market_suppliers_service.get_market_suppliers_by_id(market_supplier_id)
        if not market_supplier:
            raise LogicError("Fournisseur marché introuvable pour l'alias fourni")
    else:
        payload_market_supplier = {
            "name": cleaned_supplier_name,
            "label": "BEVERAGES" if _safe_get(import_job, "is_beverage") else None,
        }
        market_supplier = market_suppliers_service.create_market_suppliers(payload_market_supplier)
        if not market_supplier:
            raise LogicError("Création du fournisseur marché impossible")
        market_supplier_id = _safe_get(market_supplier, "id")
        if not market_supplier_id:
            raise LogicError("Fournisseur marché sans identifiant")
        market_supplier_alias_service.create_market_supplier_alias(
            {
                "supplier_market_id": market_supplier_id,
                "alias": cleaned_supplier_name,
            }
        )

    if not market_supplier_id:
        raise LogicError("Impossible de déterminer le fournisseur marché")

    suppliers = suppliers_service.get_all_suppliers(
        filters={
            "establishment_id": establishment_id,
            "market_supplier_id": market_supplier_id,
        },
        limit=1,
    )

    if suppliers:
        supplier = suppliers[0]
        supplier_id = _safe_get(supplier, "id")
        if not supplier_id:
            raise LogicError("Supplier existant sans identifiant")
    else:
        supplier_payload = {
            "establishment_id": establishment_id,
            "market_supplier_id": market_supplier_id,
            "name": cleaned_supplier_name,
            "contact_email": supplier_block.get("contact_email"),
            "contact_phone": supplier_block.get("contact_phone"),
        }
        supplier = suppliers_service.create_suppliers(supplier_payload)
        if not supplier:
            raise LogicError("Création du supplier impossible")
        supplier_id = _safe_get(supplier, "id")
        if not supplier_id:
            raise LogicError("Supplier sans identifiant")

    total_tax_value = _as_decimal(invoice_block.get("total_vat"))
    if total_tax_value is None:
        total_tax_value = _as_decimal(invoice_block.get("total_tax"))
    invoice_payload = {
        "establishment_id": establishment_id,
        "supplier_id": supplier_id,
        "invoice_number": invoice_block.get("invoice_number"),
        "date": invoice_date,
        "total_excl_tax": _decimal_to_float(_as_decimal(invoice_block.get("total_excl_tax"))),
        "total_incl_tax": _decimal_to_float(_as_decimal(invoice_block.get("total_incl_tax"))),
        "total_tax": _decimal_to_float(total_tax_value),
    }
    invoice = invoices_service.create_invoices(invoice_payload)
    invoice_id = _safe_get(invoice, "id")
    if not invoice or not invoice_id:
        raise LogicError("Création de la facture impossible")

    master_articles_cache: Dict[UUID, Any] = {}
    articles_by_master: Dict[UUID, List[ArticleEntry]] = defaultdict(list)
    master_article_ids: List[UUID] = []
    articles_created: List[ArticleEntry] = []

    for line in lines_block:
        if not isinstance(line, dict):
            continue
        cleaned_name = _apply_regex(regex_master_article, line.get("description_raw")) or line.get("description_raw")
        mma = market_master_articles_service.get_all_market_master_articles(
            filters={
                "market_supplier_id": market_supplier_id,
                "unformatted_name": cleaned_name,
            },
            limit=1,
        )
        if mma:
            market_master_article = mma[0]
        else:
            market_master_article = market_master_articles_service.create_market_master_articles(
                {
                    "market_supplier_id": market_supplier_id,
                    "name": line.get("description_raw"),
                    "unformatted_name": cleaned_name,
                    "unit": line.get("unit"),
                }
            )
        if not market_master_article:
            raise LogicError("Création du market_master_article impossible")
        market_master_article_id = _safe_get(market_master_article, "id")
        if not market_master_article_id:
            raise LogicError("Market master article sans identifiant")

        master_article = None
        if market_master_article_id:
            found_master = master_articles_service.get_all_master_articles(
                filters={
                    "establishment_id": establishment_id,
                    "market_master_article_id": market_master_article_id,
                },
                limit=1,
            )
            master_article = found_master[0] if found_master else None
        if not master_article:
            master_article = master_articles_service.create_master_articles(
                {
                    "establishment_id": establishment_id,
                    "supplier_id": supplier_id,
                    "market_master_article_id": market_master_article_id,
                    "unit": line.get("unit"),
                    "unformatted_name": cleaned_name,
                }
            )
        if not master_article:
            raise LogicError("Création du master_article impossible")
        master_article_id = _safe_get(master_article, "id")
        if not master_article_id:
            raise LogicError("Master article sans identifiant")
        master_articles_cache[master_article_id] = master_article
        master_article_ids.append(master_article_id)

        quantity = _as_decimal(line.get("quantity"))
        unit_price = _as_decimal(line.get("unit_price_excl_tax"))
        line_total = _as_decimal(line.get("line_total_excl_tax"))
        discounts = _as_decimal(line.get("discounts"))
        duties = _as_decimal(line.get("duties_and_taxes"))

        market_articles_service.create_market_articles(
            {
                "market_master_article_id": market_master_article_id,
                "market_supplier_id": market_supplier_id,
                "date": invoice_date,
                "unit": line.get("unit"),
                "unit_price": _decimal_to_float(unit_price),
                "discounts": _decimal_to_float(discounts),
                "duties_and_taxes": _decimal_to_float(duties),
            }
        )

        article = articles_service.create_articles(
            {
                "establishment_id": establishment_id,
                "supplier_id": supplier_id,
                "master_article_id": master_article_id,
                "invoice_id": invoice_id,
                "date": invoice_date,
                "quantity": _decimal_to_float(quantity),
                "unit": line.get("unit"),
                "unit_price": _decimal_to_float(unit_price),
                "total": _decimal_to_float(line_total),
                "discounts": _decimal_to_float(discounts),
                "duties_and_taxes": _decimal_to_float(duties),
            }
        )
        article_id = _safe_get(article, "id")
        if not article or not article_id:
            raise LogicError("Création de l'article impossible")

        entry = ArticleEntry(
            article_id=article_id,
            master_article_id=master_article_id,
            unit_price=unit_price,
            quantity=quantity,
            line_total=line_total,
            discounts=discounts,
            duties=duties,
            date=invoice_date,
        )
        articles_by_master[master_article_id].append(entry)
        articles_created.append(entry)

    master_article_ids = _unique(master_article_ids)

    ingredients_all = ingredients_service.get_all_ingredients(
        filters={"establishment_id": establishment_id},
        limit=10000,
    )
    recipes_all = recipes_service.get_all_recipes(
        filters={"establishment_id": establishment_id},
        limit=5000,
    )
    recipes_cache: Dict[UUID, Any] = {}
    for recipe in recipes_all:
        recipe_id = _safe_get(recipe, "id")
        if recipe_id:
            recipes_cache[recipe_id] = recipe

    ingredients_by_recipe: Dict[UUID, List[Any]] = defaultdict(list)
    recipes_by_master: Dict[UUID, Set[UUID]] = defaultdict(set)
    for ingredient in ingredients_all:
        recipe_id = _safe_get(ingredient, "recipe_id")
        if recipe_id:
            ingredients_by_recipe[recipe_id].append(ingredient)
        master_id = _safe_get(ingredient, "master_article_id")
        if (
            _safe_get(ingredient, "type") == "ARTICLE"
            and master_id
            and recipe_id
        ):
            recipes_by_master[master_id].add(recipe_id)

    impacted_recipes_article: set[UUID] = set()

    for ingredient in ingredients_all:
        if _safe_get(ingredient, "type") != "ARTICLE":
            continue
        master_article_id = _safe_get(ingredient, "master_article_id")
        if master_article_id not in master_article_ids:
            continue
        article_entries = articles_by_master.get(master_article_id)
        if not article_entries:
            continue
        gross_unit_price = _compute_weighted_unit_price(article_entries)
        if gross_unit_price is None:
            continue
        history_prev, history_next = _history_reference_for_ingredient(_safe_get(ingredient, "id"), invoice_date)
        base_history = history_prev or history_next
        quantity_reference = _as_decimal(_safe_get(base_history, "quantity")) or _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
        percentage_loss = _as_decimal(_safe_get(base_history, "percentage_loss")) or _as_decimal(_safe_get(ingredient, "percentage_loss")) or Decimal("0")
        loss_multiplier = Decimal("1") + (percentage_loss / Decimal("100"))
        gross_total = gross_unit_price * quantity_reference
        unit_cost = gross_total * loss_multiplier
        loss_value = unit_cost - gross_total if percentage_loss else None

        recipe_id = _safe_get(ingredient, "recipe_id")
        recipe = recipes_cache.get(recipe_id) if recipe_id else None
        if not recipe:
            continue
        portion = _ensure_portion(recipe_id, _as_decimal(_safe_get(recipe, "portion")))
        unit_cost_per_portion = unit_cost / portion

        history_payload = {
            "ingredient_id": _safe_get(ingredient, "id"),
            "establishment_id": establishment_id,
            "recipe_id": recipe_id,
            "master_article_id": master_article_id,
            "unit": _safe_get(base_history, "unit") or _safe_get(ingredient, "unit"),
            "quantity": _decimal_to_float(quantity_reference),
            "percentage_loss": _decimal_to_float(percentage_loss),
            "gross_unit_price": _decimal_to_float(gross_unit_price),
            "unit_cost": _decimal_to_float(unit_cost),
            "unit_cost_per_portion_recipe": _decimal_to_float(unit_cost_per_portion),
            "loss_value": _decimal_to_float(loss_value),
            "date": invoice_date,
        }
        history_ingredients_service.create_history_ingredients(history_payload)
        ingredients_service.update_ingredients(
            _safe_get(ingredient, "id"),
            {
                "gross_unit_price": history_payload["gross_unit_price"],
                "unit_cost": history_payload["unit_cost"],
                "unit_cost_per_portion_recipe": history_payload["unit_cost_per_portion_recipe"],
                "percentage_loss": history_payload["percentage_loss"],
                "loss_value": history_payload["loss_value"],
            },
        )
        ingredient.gross_unit_price = history_payload["gross_unit_price"]
        ingredient.unit_cost = history_payload["unit_cost"]
        ingredient.unit_cost_per_portion_recipe = history_payload["unit_cost_per_portion_recipe"]
        ingredient.percentage_loss = history_payload["percentage_loss"]
        ingredient.loss_value = history_payload["loss_value"]
        impacted_recipes_article.add(recipe_id)

    def _recompute_recipes(recipe_ids: Iterable[UUID]) -> List[UUID]:
        impacted: List[UUID] = []
        for recipe_id in _unique(recipe_ids):
            recipe = recipes_cache.get(recipe_id)
            if not recipe:
                continue
            ingredients_of_recipe = ingredients_by_recipe.get(recipe_id, [])
            purchase_cost_total = _compute_recipe_cost(ingredients_of_recipe)
            portion = _ensure_portion(recipe_id, _as_decimal(_safe_get(recipe, "portion")))
            purchase_cost_per_portion = purchase_cost_total / portion
            future_history, _ = _future_history_recipe(recipe_id, invoice_date)
            history_payload = {
                "purchase_cost_total": _decimal_to_float(purchase_cost_total),
                "purchase_cost_per_portion": _decimal_to_float(purchase_cost_per_portion),
            }
            if future_history is None:
                payload = {
                    "recipe_id": recipe_id,
                    "establishment_id": establishment_id,
                    "date": invoice_date,
                    "portion": _safe_get(recipe, "portion"),
                    "vat_id": _safe_get(recipe, "vat_id"),
                    "price_excl_tax": _safe_get(recipe, "price_excl_tax"),
                    "price_incl_tax": _safe_get(recipe, "price_incl_tax"),
                    "price_tax": _safe_get(recipe, "price_tax"),
                    **history_payload,
                }
                history_recipes_service.create_history_recipes(payload)
            else:
                history_recipes_service.update_history_recipes(_safe_get(future_history, "id"), history_payload)
            latest_histories = history_recipes_service.get_all_history_recipes(
                filters={
                    "recipe_id": recipe_id,
                    "order_by": "date",
                    "direction": "asc",
                },
                limit=1000,
            )
            latest_entry = latest_histories[-1] if latest_histories else None
            recipe_update = {
                "purchase_cost_total": history_payload["purchase_cost_total"],
                "purchase_cost_per_portion": history_payload["purchase_cost_per_portion"],
            }
            if _safe_get(recipe, "saleable"):
                recommended = _recommended_price(purchase_cost_per_portion, establishment)
                if recommended is not None:
                    recipe_update["recommanded_retail_price"] = float(recommended)
            recipes_service.update_recipes(recipe_id, recipe_update)
            recipe.purchase_cost_total = recipe_update["purchase_cost_total"]
            recipe.purchase_cost_per_portion = recipe_update["purchase_cost_per_portion"]
            recipe.recommanded_retail_price = recipe_update.get("recommanded_retail_price")
            impacted.append(recipe_id)
        return impacted

    impacted_article_recipes = _recompute_recipes(impacted_recipes_article)
    impacted_article_recipes_set = set(impacted_article_recipes)

    ingredients_sub = [
        ingredient
        for ingredient in ingredients_all
        if (_safe_get(ingredient, "type") or "").upper() in {"SUBRECIPE", "SUBRECIPES"}
        and _safe_get(ingredient, "subrecipe_id") in impacted_article_recipes_set
    ]

    impacted_recipes_sub: set[UUID] = set()

    for ingredient in ingredients_sub:
        subrecipe_id = _safe_get(ingredient, "subrecipe_id")
        subrecipe = recipes_cache.get(subrecipe_id)
        if not subrecipe:
            continue
        purchase_cost_per_portion = _as_decimal(_safe_get(subrecipe, "purchase_cost_per_portion"))
        if purchase_cost_per_portion is None:
            continue
        quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("0")
        gross_unit_price = purchase_cost_per_portion
        unit_cost = gross_unit_price * quantity
        histories = history_ingredients_service.get_all_history_ingredients(
            filters={
                "ingredient_id": _safe_get(ingredient, "id"),
                "order_by": "date",
                "direction": "asc",
            },
            limit=500,
        )
        future_histories = [hist for hist in histories if (_as_date(_safe_get(hist, "date")) or date.min) > invoice_date]
        payload = {
            "ingredient_id": _safe_get(ingredient, "id"),
            "establishment_id": establishment_id,
            "recipe_id": _safe_get(ingredient, "recipe_id"),
            "subrecipe_id": subrecipe_id,
            "unit": _safe_get(ingredient, "unit"),
            "quantity": _decimal_to_float(quantity),
            "gross_unit_price": _decimal_to_float(gross_unit_price),
            "unit_cost": _decimal_to_float(unit_cost),
            "percentage_loss": 0,
            "loss_value": None,
            "date": invoice_date,
        }
        if not future_histories:
            history_ingredients_service.create_history_ingredients(payload)
        else:
            latest = future_histories[-1]
            history_ingredients_service.update_history_ingredients(_safe_get(latest, "id"), payload)
        ingredients_service.update_ingredients(
            _safe_get(ingredient, "id"),
            {
                "gross_unit_price": payload["gross_unit_price"],
                "unit_cost": payload["unit_cost"],
                "loss_value": payload["loss_value"],
                "percentage_loss": 0,
            },
        )
        ingredient.gross_unit_price = payload["gross_unit_price"]
        ingredient.unit_cost = payload["unit_cost"]
        impacted_recipes_sub.add(_safe_get(ingredient, "recipe_id"))

    impacted_sub_recipes = _recompute_recipes(impacted_recipes_sub)

    impacted_for_margins = set(impacted_article_recipes) | set(impacted_sub_recipes)
    impacted_recipes_saleable = [
        recipes_cache[rid]
        for rid in impacted_for_margins
        if rid in recipes_cache
        and _safe_get(recipes_cache[rid], "saleable")
        and _safe_get(recipes_cache[rid], "active")
    ]

    if impacted_recipes_saleable:
        all_saleable_recipes = [
            recipe
            for recipe in recipes_cache.values()
            if _safe_get(recipe, "saleable") and _safe_get(recipe, "active")
        ]

        def _upsert_margin(service_get, service_create, service_update, base_filters: Dict[str, Any], avg_margin: Optional[Decimal]) -> None:
            if avg_margin is None:
                return
            payload = {
                **base_filters,
                "average_margin": float(avg_margin),
                "date": invoice_date,
            }
            filters = {**base_filters, "order_by": "date", "direction": "desc"}
            existing = service_get(filters=filters, limit=1)
            if existing:
                existing_date = _as_date(_safe_get(existing[0], "date"))
                if existing_date and existing_date >= invoice_date:
                    service_update(_safe_get(existing[0], "id"), payload)
                    return
            service_create(payload)

        avg_global = _mean([
            _as_decimal(_safe_get(recipe, "current_margin")) or Decimal("0")
            for recipe in all_saleable_recipes
        ])
        _upsert_margin(
            recipe_margin_service.get_all_recipe_margin,
            recipe_margin_service.create_recipe_margin,
            recipe_margin_service.update_recipe_margin,
            {"establishment_id": establishment_id},
            avg_global,
        )

        category_ids = _unique(
            _safe_get(recipe, "category_id") for recipe in impacted_recipes_saleable if _safe_get(recipe, "category_id")
        )
        for category_id in category_ids:
            avg = _mean([
                _as_decimal(_safe_get(recipe, "current_margin")) or Decimal("0")
                for recipe in impacted_recipes_saleable
                if _safe_get(recipe, "category_id") == category_id
            ])
            _upsert_margin(
                recipe_margin_category_service.get_all_recipe_margin_category,
                recipe_margin_category_service.create_recipe_margin_category,
                recipe_margin_category_service.update_recipe_margin_category,
                {"establishment_id": establishment_id, "category_id": category_id},
                avg,
            )

        subcategory_ids = _unique(
            _safe_get(recipe, "subcategory_id")
            for recipe in impacted_recipes_saleable
            if _safe_get(recipe, "subcategory_id")
        )
        for subcategory_id in subcategory_ids:
            avg = _mean([
                _as_decimal(_safe_get(recipe, "current_margin")) or Decimal("0")
                for recipe in impacted_recipes_saleable
                if _safe_get(recipe, "subcategory_id") == subcategory_id
            ])
            _upsert_margin(
                recipe_margin_subcategory_service.get_all_recipe_margin_subcategory,
                recipe_margin_subcategory_service.create_recipe_margin_subcategory,
                recipe_margin_subcategory_service.update_recipe_margin_subcategory,
                {"establishment_id": establishment_id, "subcategory_id": subcategory_id},
                avg,
            )

    variations_created = []
    for entry in articles_created:
        if entry.unit_price is None or entry.master_article_id is None:
            continue
        previous_candidates = articles_service.get_all_articles(
            filters={
                "establishment_id": establishment_id,
                "master_article_id": entry.master_article_id,
                "date_lte": invoice_date.isoformat(),
                "order_by": "date",
                "direction": "desc",
            },
            limit=5,
        )
        previous_article = None
        for candidate in previous_candidates:
            candidate_date = _as_date(_safe_get(candidate, "date"))
            if candidate_date and candidate_date < invoice_date:
                previous_article = candidate
                break
        if not previous_article:
            continue
        old_price = _as_decimal(_safe_get(previous_article, "unit_price"))
        if not old_price or old_price == 0:
            continue
        percentage = ((entry.unit_price - old_price) / old_price) * Decimal("100")
        if percentage == 0:
            continue
        variation = variations_service.create_variations(
            {
                "establishment_id": establishment_id,
                "master_article_id": entry.master_article_id,
                "invoice_id": invoice_id,
                "old_unit_price": _decimal_to_float(old_price),
                "new_unit_price": _decimal_to_float(entry.unit_price),
                "percentage": _decimal_to_float(percentage),
                "date": invoice_date,
            }
        )
        if variation:
            variations_created.append(variation)

    can_send_sms = bool(variations_created) and _safe_get(establishment, "active_sms")
    supplier_label_effective = _resolve_supplier_label(supplier, market_supplier)
    if can_send_sms:
        type_sms = _safe_get(establishment, "type_sms") or "FOOD"
        if not supplier_label_effective:
            can_send_sms = False
        elif type_sms == "FOOD" and supplier_label_effective != "FOOD":
            can_send_sms = False
        elif type_sms == "FOOD & BEVERAGES" and supplier_label_effective not in {"FOOD", "BEVERAGES"}:
            can_send_sms = False

    alert_id = None
    if can_send_sms:
        trigger = _safe_get(establishment, "sms_variation_trigger") or "ALL"
        threshold = Decimal(str({"ALL": 0, "±5%": 5, "±10%": 10}.get(trigger, 0)))
        filtered_variations = []
        for variation in variations_created:
            pct_value = _as_decimal(_safe_get(variation, "percentage")) or Decimal("0")
            if abs(pct_value) >= threshold:
                filtered_variations.append(variation)
        if filtered_variations:
            user_links = user_establishment_service.get_all_user_establishment(
                filters={"establishment_id": establishment_id}
            )
            recipient_numbers: List[str] = []
            for link in user_links:
                if _safe_get(link, "role") not in {"owner", "admin"}:
                    continue
                profile = user_profiles_service.get_user_profiles_by_id(_safe_get(link, "user_id"))
                phone = _safe_get(profile, "phone_sms") if profile else None
                if phone:
                    recipient_numbers.append(phone)
            if recipient_numbers:
                filtered_variations.sort(
                    key=lambda item: float(_safe_get(item, "percentage") or 0),
                    reverse=True,
                )
                top_variations = filtered_variations[:5]
                extra_count = max(0, len(filtered_variations) - len(top_variations))
                variation_lines = []
                for variation in top_variations:
                    master_article = master_articles_cache.get(_safe_get(variation, "master_article_id"))
                    article_name = _safe_get(master_article, "unformatted_name") or _safe_get(master_article, "name") or "Article"
                    pct_decimal = _as_decimal(_safe_get(variation, "percentage")) or Decimal("0")
                    pct_value = float(pct_decimal)
                    sign = "+" if pct_decimal > 0 else ""
                    variation_lines.append(f"- {article_name} : {sign}{pct_value:.1f}%")
                block_variations = "\n".join(variation_lines)
                block_extra = f"+{extra_count} autres variations" if extra_count else ""
                impacted_recipes_from_variations = set()
                for variation in filtered_variations:
                    impacted_recipes_from_variations.update(recipes_by_master.get(_safe_get(variation, "master_article_id"), set()))
                recipes_impacted_count = len(
                    {
                        rid
                        for rid in impacted_recipes_from_variations
                        if rid in recipes_cache
                        and _safe_get(recipes_cache[rid], "saleable")
                        and _safe_get(recipes_cache[rid], "active")
                    }
                )
                supplier_name_for_sms = _safe_get(supplier, "name") or cleaned_supplier_name
                sms_lines = [f"{supplier_name_for_sms} du {invoice_date}:", "", block_variations]
                if block_extra:
                    sms_lines.append(block_extra)
                if recipes_impacted_count:
                    sms_lines.extend(["", f"Impact sur {recipes_impacted_count} recettes."])
                sms_text = "\n".join(line for line in sms_lines if line.strip())
                recipient_numbers = list(dict.fromkeys(recipient_numbers))
                alert = alert_logs_service.create_alert_logs(
                    {
                        "establishment_id": establishment_id,
                        "content": sms_text,
                        "sent_to_number": ",".join(recipient_numbers),
                        "payload": {
                            "invoice_id": str(invoice_id),
                            "variation_count": len(filtered_variations),
                            "trigger": trigger,
                        },
                    }
                )
                if not alert:
                    raise LogicError("Création de l'alerte SMS impossible")
                alert_id = _safe_get(alert, "id")
                if alert_id:
                    for variation in filtered_variations:
                        variations_service.update_variations(
                            _safe_get(variation, "id"),
                            {"alert_logs_id": alert_id},
                        )

    import_jobs_service.update_import_job(import_job_id, {"status": "COMPLETED"})
