# FONCTION POUR L'IMPORT D'UNE FACTURE

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple
from uuid import UUID

# Services concernés par la logic

from app.services import (
    alert_logs_service,
    articles_service,
    establishments_service,
    history_ingredients_service,
    history_recipes_service,
    import_job_service as import_jobs_service,
    ingredients_service,
    invoices_service,
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

# ---------------------------------------------------------------------------
# TEMPLATE JSON DE RECEPTION DEPUIS N8N
# ---------------------------------------------------------------------------

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

# FONCTION POUR FORMATTAGE DATE POUR SMS
def _format_sms_date(d: date) -> str:
    months = {
        1: "janv.", 2: "fevr.", 3: "mars", 4: "avr.",
        5: "mai", 6: "juin", 7: "juil.", 8: "aoUt",
        9: "sept.", 10: "oct.", 11: "nov.", 12: "dec."
    }
    return f"{d.day} {months[d.month]}"

# FONCTION REGEX
def _safe_get(obj: Any, key: str) -> Any:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


import unicodedata
import re

def _apply_regex(
    pattern: Optional[str],
    value: Optional[str],
    pattern_type: Optional[str] = None
) -> Optional[str]:
    if value is None:
        return None
    if not pattern:
        result = value.strip()
    else:
        try:
            # Respecte les flags présents dans la regex (ex: (?i))
            result = re.sub(pattern, "", value)
            result = result.strip()
        except re.error as exc:
            raise LogicError(f"Regex invalide: {pattern}") from exc

    # --------- NORMALISATION SPÉCIALE -----------
    # si c'est un market_master_article_name → minuscule
    if pattern_type == "market_master_article_name" and result:
        result = ''.join(
        c for c in unicodedata.normalize('NFKD', result)
        if not unicodedata.combining(c)
        )
        result = result.lower()

    return result or None


def _extract_regex(pattern_type: str) -> Optional[str]:
    patterns = regex_patterns_service.get_all_regex_patterns(
        filters={"type": pattern_type},
        limit=1,
    )
    if not patterns:
        return None
    return _safe_get(patterns[0], "regex")


# UNIFORMISATION DES NOMBRES

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


# def _decimal_to_float(value: Optional[Decimal]) -> Optional[float]:
 #   if value is None:
  #      return None
 #   return float(value)


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
    # Si aucune portion n'est spécifiée, la règle métier RAVY = 1 portion
    if portion is None or portion == 0:
        return Decimal("1")
    return portion


def _compute_recipe_cost(ingredients: Iterable[Any]) -> Decimal:
    total = Decimal("0")
    for ingredient in ingredients:
        total += _decimal_or_zero(_as_decimal(_safe_get(ingredient, "unit_cost")))
        # ATTETION ICI ON PREN UNIT_COST ET PAS UNIT_COST_PER_PORTION -> A VERIFIER
    return total


def _compute_weighted_unit_price(entries: List[ArticleEntry]) -> Optional[Decimal]:
    # CHECKER DEPUIS OU CETTE DEF. EST APPELLE CAR DOUTE SUR FONCTIONNEMENT/UTILITE
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
            total_value += line_total - discounts + duties # attention au - et +
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
        margin = value / Decimal("100")  
        if margin >= 1:
            return None  # impossible (100% de marge ou + -> prix infini)
        return cost_per_portion / (Decimal("1") - margin)
    if method == "VALUE":
        return cost_per_portion + value
    return None


def _compute_initial_supplier_label(market_supplier: Any, import_job: Any) -> Optional[str]:
    # 1. Si le job force BEVERAGES (cas particulier)
    if _safe_get(import_job, "is_beverage") is True:
        return "BEVERAGES"
    # 2. Sinon → prendre le label du market supplier si présent
    market_label = _safe_get(market_supplier, "label")
    if market_label:
        return market_label
    # 3. Sinon → pas de label pour ce supplier privé
    return None


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
        import_jobs_service.update_import_job(import_job_id, {"status": "error"})
        raise


def _import_invoice_from_import_job(import_job_id: UUID) -> None:
    import_job = import_jobs_service.get_import_job_by_id(import_job_id)
    if not import_job:
        raise LogicError("Import job introuvable")

    status = (_safe_get(import_job, "status") or "").upper()
    if status in {"completed", "error", "ocr_failed"}:
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
    cleaned_supplier_name = _apply_regex(regex_supplier, raw_supplier_name, "supplier_name") or raw_supplier_name or "Fournisseur"

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
            "label": _safe_get(market_supplier, "label"),   # ← IMPORTANT

        }
        supplier = suppliers_service.create_suppliers(supplier_payload)
        if not supplier:
            raise LogicError("Création du supplier impossible")
        supplier_id = _safe_get(supplier, "id")
        if not supplier_id:
            raise LogicError("Supplier sans identifiant")
        
    ht  = _as_decimal(invoice_block.get("total_excl_tax"))
    ttc = _as_decimal(invoice_block.get("total_incl_tax"))
    tva = _as_decimal(invoice_block.get("total_vat"))

    is_credit_note = any( v is not None and v < 0 for v in [ht, ttc, tva]) # <- DETECTION FACTURE OU AVOIR

    values_present = sum(v is not None for v in [ht, ttc, tva])
    if values_present == 2:
    # Recalcul de la valeur manquante
        if ht is None and ttc is not None and tva is not None:
            ht = ttc - tva
        elif ttc is None and ht is not None and tva is not None:
            ttc = ht + tva
        elif tva is None and ht is not None and ttc is not None:
            tva = ttc - ht
# Si values_present < 2 → on ne calcule rien (comme sur Bubble)
    invoice_payload = {
    "establishment_id": establishment_id,
    "supplier_id": supplier_id,
    "invoice_number": invoice_block.get("invoice_number"),
    "date": invoice_date,
    "total_excl_tax": ht,
    "total_incl_tax": ttc,
    "total_tax": tva,
    "file_storage_path": _safe_get(import_job, "file_path"),
    "import_mode": "EMAIL",
    }

    invoice = invoices_service.create_invoices(invoice_payload)
    invoice_id = _safe_get(invoice, "id")
    if not invoice or not invoice_id:
        raise LogicError("Création de la facture impossible")
    
    if is_credit_note:
        import_jobs_service.update_import_job(import_job_id, {"status": "completed"})
        return # ON S'ARRETE LA SI C'EST UNE FACTURE D'AVOIR

    master_articles_cache: Dict[UUID, Any] = {}
    articles_by_master: Dict[UUID, List[ArticleEntry]] = defaultdict(list)
    master_article_ids: List[UUID] = []
    articles_created: List[ArticleEntry] = []
    regex_master_article = _extract_regex("market_master_article_name")

    for line in lines_block:
        if not isinstance(line, dict):
            continue
        raw_name = line.get("product_name")
        cleaned_name = _apply_regex(regex_master_article, raw_name, "market_master_article_name") or raw_name
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
                    "name": line.get("product_name"),
                    "unformatted_name": cleaned_name,
                    "unit": line.get("unit"),
                    "current_unit_price": _as_decimal(line.get("unit_price_excl_tax")),
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
                    "current_unit_price": _as_decimal(line.get("unit_price_excl_tax")),
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
                "establishment_id": establishment_id,
                "date": invoice_date,
                "unit": line.get("unit"),
                "unit_price": unit_price,
                "discounts": discounts,
                "duties_and_taxes": duties,
                "invoice_path": _safe_get(import_job, "file_path"),
                "quantity": quantity,
                "invoices_id": invoice_id,
            }
        )

        article = articles_service.create_articles(
            {
                "establishment_id": establishment_id,
                "supplier_id": supplier_id,
                "master_article_id": master_article_id,
                "invoice_id": invoice_id,
                "date": invoice_date,
                "quantity": quantity,
                "unit": line.get("unit"),
                "unit_price": unit_price,
                "total": line_total,
                "discounts": discounts,
                "duties_and_taxes": duties,
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

        # Mise à jour du current_unit_price du master_article
        latest_articles = articles_service.get_all_articles(
            filters={
                "master_article_id": master_article_id,
                "order_by": "date",
                "direction": "desc",
            },
            limit=1,
        )
        if latest_articles:
            latest_art = latest_articles[0]
            master_articles_service.update_master_articles(
                master_article_id,
                {"current_unit_price": _safe_get(latest_art, "unit_price")},
            )
        # Mise à jour du current_unit_price du market_master_article
        latest_market_articles = market_articles_service.get_all_market_articles(
            filters={
                "market_master_article_id": market_master_article_id,
                "order_by": "date",
                "direction": "desc",
            },
            limit=1,
        )
        if latest_market_articles:
            latest_mma = latest_market_articles[0]
            market_master_articles_service.update_market_master_articles(
               market_master_article_id,
                {"current_unit_price": _safe_get(latest_mma, "unit_price")},
            )


    master_article_ids = _unique(master_article_ids)


#REMONTE TOUS LES INGREDIENTS & RECETTES D'UN RESTAURANT (LIMIT 10000)

    ingredients_all = ingredients_service.get_all_ingredients(
        filters={"establishment_id": establishment_id},
        limit=10000,
    )
    recipes_all = recipes_service.get_all_recipes(
        filters={"establishment_id": establishment_id},
        limit=5000,
    )

# CREATION DU CACHE O(1) POUR UNE RECHERCHE (TRÈS) RAPIDE
    recipes_cache: Dict[UUID, Any] = {}
    for recipe in recipes_all:
        recipe_id = _safe_get(recipe, "id")
        if recipe_id:
            recipes_cache[recipe_id] = recipe

# CRÉATION DE FILTRES POUR POUVOIR A)TROUVER TOUS LES INGREDIENTS D'UNE RECETTE B) SAVOIR QUELS RECETTES UTILISENTS QUELS MASTER_ARTICLES
    ingredients_by_recipe: Dict[UUID, List[Any]] = defaultdict(list)
    recipes_by_master: Dict[UUID, Set[UUID]] = defaultdict(set)

    for ingredient in ingredients_all:

        # REMPLIS LE FILTRE INGREDIENT PAR RECETTE
        recipe_id = _safe_get(ingredient, "recipe_id")
        if recipe_id:
            ingredients_by_recipe[recipe_id].append(ingredient)
        # REMPLIS LE FILTRE RECIPES MASTER
        master_id = _safe_get(ingredient, "master_article_id")
        if (
            _safe_get(ingredient, "type") == "ARTICLE"
            and master_id
            and recipe_id
        ):
            recipes_by_master[master_id].add(recipe_id)

# LISTE VIDE POUR STOCKER LES RECETTES IMPACTÉS
    impacted_recipes_article: set[UUID] = set()

    for ingredient in ingredients_all:
        if _safe_get(ingredient, "type") != "ARTICLE": # Passe a l'ingredient suivant si il n'est pas de type ARTICLE
            continue
        master_article_id = _safe_get(ingredient, "master_article_id") # On recuper le master_article correspondant a cet ingrédient et si c'est vide (pas dans la facture) on passe au suivant
        if master_article_id not in master_article_ids:
            continue
        article_entries = articles_by_master.get(master_article_id) # On récupère la ligne d'article correspondant a ce master article et si c'est vide (pas dans la facture) on passe au suivant
        if not article_entries:
            continue
        entry = article_entries[0]
        gross_unit_price = entry.unit_price # On recupere le prix unitaire de l'article et on passe a l'ingredient suivant si il est vide
        if gross_unit_price is None:
            continue

        history_prev, history_next = _history_reference_for_ingredient(_safe_get(ingredient, "id"), invoice_date) 
        base_history = history_prev or history_next

        # VA CHERCHER LES INFOS POUR LES CALCULS AVEC FALLBACK SUR INGREDIENT SI RIEN PUIS FALLBACK SUR VALEUR PRECISE SI RIEN DANS L'INGR.
        quantity_reference = _as_decimal(_safe_get(base_history, "quantity")) or _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
        percentage_loss = _as_decimal(_safe_get(base_history, "percentage_loss")) or Decimal("0")
        loss_multiplier = Decimal("1") + (percentage_loss / Decimal("100"))
        gross_total = gross_unit_price * quantity_reference
        unit_cost = gross_total * loss_multiplier
        loss_value = unit_cost - gross_total if percentage_loss else None

        # VA CHERCHER LE NOMBRE DE PORTION DE LA RECETTE VIA UNE DEF. POUR CALCULER LE COUT PAR PORTION
        recipe_id = _safe_get(ingredient, "recipe_id")
        recipe = recipes_cache.get(recipe_id) if recipe_id else None
        if not recipe:
            continue
        portion = _ensure_portion(recipe_id, _as_decimal(_safe_get(recipe, "portion")))
        unit_cost_per_portion = unit_cost / portion

        history_date = datetime.combine(invoice_date, time(0, 0)) # CONVERTI LA DATE DE FACTURE EN HEURE+MINUTE POUR RESPECTER LE FORMAT DE LA BDD (TIMESTAMPZ VS DATE)
        
        #  CALCUL DU NUMÉRO DE VERSION (+0.01 OU -0.01)
        prev_version = _as_decimal(_safe_get(history_prev, "version_number")) if history_prev else None
        next_version = _as_decimal(_safe_get(history_next, "version_number")) if history_next else None

        if prev_version is not None and next_version is None:
            version_number = prev_version + Decimal("0.01")
        elif prev_version is None and next_version is not None:
            version_number = next_version - Decimal("0.01")
        elif prev_version is not None and next_version is not None:
            version_number = prev_version + Decimal("0.01")
        else:
            raise LogicError("Aucun historique ingredient trouvé alors qu'il devrait exister")
        
        history_payload = {
            "ingredient_id": _safe_get(ingredient, "id"),
            "establishment_id": establishment_id,
            "recipe_id": recipe_id,
            "master_article_id": master_article_id,
            "unit": _safe_get(base_history, "unit") or _safe_get(ingredient, "unit"),
            "quantity": quantity_reference,
            "percentage_loss": percentage_loss,
            "gross_unit_price": gross_unit_price,
            "unit_cost": unit_cost,
            "unit_cost_per_portion_recipe": unit_cost_per_portion,
            "loss_value":loss_value,
            "date": history_date,
            "version_number": version_number,
        }
        history_ingredients_service.create_history_ingredients(history_payload) # <- CREATION DE L'HISTORIQUE INGREDIENT

        # MISE À JOUR DE L'INGREDIENT AVEC LE HISTORY_INGREDIENT LE PLUS RECENT
        
        ingredient_id = _safe_get(ingredient, "id")

        latest_histories = history_ingredients_service.get_all_history_ingredients(
            filters={
                "ingredient_id": ingredient_id,
                "order_by": "date",
                "direction": "asc",
            },
            limit=1000,
)
        latest_history = latest_histories[-1] if latest_histories else None # PREND L'HISTORIQUE LE PLUS RECENT
        if not latest_history:
            raise LogicError("Impossible de récupérer l'historique le plus récent pour l'ingrédient")

        update_payload = {
            "gross_unit_price": _safe_get(latest_history, "gross_unit_price"),
            "unit_cost": _safe_get(latest_history, "unit_cost"),
            "unit_cost_per_portion_recipe": _safe_get(latest_history, "unit_cost_per_portion_recipe"),
            "percentage_loss": _safe_get(latest_history, "percentage_loss"),
            "loss_value": _safe_get(latest_history, "loss_value"),
        }

        ingredients_service.update_ingredients(
            ingredient_id,
            update_payload,
        ) # MISE À JOUR DE L'INGREDIENT VIA LE SERVICE

        ingredient.gross_unit_price = update_payload["gross_unit_price"]
        ingredient.unit_cost = update_payload["unit_cost"]
        ingredient.unit_cost_per_portion_recipe = update_payload["unit_cost_per_portion_recipe"]
        ingredient.percentage_loss = update_payload["percentage_loss"]
        ingredient.loss_value = update_payload["loss_value"]

        impacted_recipes_article.add(recipe_id)
        
    # DEF DE MISE À JOUR DES RECETTE BASÉ SUR LES NOUVEAU INGREDIENTS

    def _recompute_recipes(recipe_ids: Iterable[UUID]) -> List[UUID]: 
        impacted: List[UUID] = []

        for recipe_id in _unique(recipe_ids):
            recipe = recipes_cache.get(recipe_id)
            if not recipe:
                continue # PREND LES RECETTE FILTRED BY UNIQUE ELEMENT (POUR PAS EN MODIFIER UNE PLUSIEURS FOIS)

            ingredients_of_recipe = ingredients_by_recipe.get(recipe_id, [])
            purchase_cost_total = _compute_recipe_cost(ingredients_of_recipe)
            portion = _ensure_portion(recipe_id, _as_decimal(_safe_get(recipe, "portion")))
            purchase_cost_per_portion = purchase_cost_total / portion
            #CALCUL DE MARGE UNIQUEMENT SI SALEABLE:TRUE
            margin = None
            if _safe_get(recipe, "saleable"):
                price_excl_tax = _as_decimal(_safe_get(recipe, "price_excl_tax"))
                if price_excl_tax and price_excl_tax != 0:
                    margin = ((price_excl_tax - purchase_cost_per_portion) / price_excl_tax) * Decimal("100")

            # CONSTRUCTION DU PAYLOAD POUR UPDATE LE PLUS RECENT DES HISTORIQUE RECETTE
            future_history, _ = _future_history_recipe(recipe_id, invoice_date) #VA CHERCHER LE PLUS RECENT DES HISTORY_RECIPE (LE DERNIER QUI A ÉTÉ CRÉER)
            history_payload = {
                "purchase_cost_total": purchase_cost_total,
                "purchase_cost_per_portion": purchase_cost_per_portion,
            }
            # AJOUT DE LA MARGE AU PAYLOAD SI ELLE EST VENDABLE
            if margin is not None:
                history_payload["margin"] = margin


            # --- CALCUL DU VERSION_NUMBER ---
            all_histories = history_recipes_service.get_all_history_recipes(
                filters={"recipe_id": recipe_id, "order_by": "date", "direction": "asc"},
                limit=1000,
            )
            if all_histories:
                last_version = _as_decimal(_safe_get(all_histories[-1], "version_number")) or Decimal("1")
                version_number = last_version + Decimal("0.01")
            else:
                version_number = Decimal("0.01")
            
            # CONSTRUCTRION DU PAYLOAD POUR LA CREATION L'HISTORIQUE RECETTE
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
                    "margin": margin if margin is not None else None,
                    "version_number": version_number,
                    **history_payload,
                }
                history_recipes_service.create_history_recipes(payload) # CRÉER UN HISTORY_RECIPE SI I LN'EN EXISTE AUCUN DE PLUS RECENT QUE LA DATE DE FACTURE SINON ON UPDATE LE PLUS RECENT

            else:
                update_payload = {
                    **history_payload,  # updates cost_total + cost_per_portion
                }
                if margin is not None:
                    update_payload["margin"] = margin

                history_recipes_service.update_history_recipes(_safe_get(future_history, "id"), update_payload)
            
            # MISE À JOUR DE LA RECETTE BASÉ SUR LE HISTORIQUE RECETTE LE PLUS RECENT
            latest_histories = history_recipes_service.get_all_history_recipes(
                filters={ "recipe_id": recipe_id, "order_by": "date", "direction": "asc" },
                limit=1000,
            )
            latest_entry = latest_histories[-1] if latest_histories else None

            recipe_update = {
                "purchase_cost_total": _safe_get(latest_entry, "purchase_cost_total"),
                "purchase_cost_per_portion": _safe_get(latest_entry, "purchase_cost_per_portion"),
            }
            # MODIFIER L'UPDATE SI LA RECETTE EST VENDABLE
            if _safe_get(recipe, "saleable"):
                recommended = _recommended_price(
                    _as_decimal(_safe_get(latest_entry, "purchase_cost_per_portion")),
                    establishment
                )
                if recommended is not None:
                    recipe_update["recommanded_retail_price"] = recommended

                margin_latest = _safe_get(latest_entry, "margin")
                if margin_latest is not None:
                    recipe_update["current_margin"] = margin_latest

            recipes_service.update_recipes(recipe_id, recipe_update) #MISE À JOUR DE LA RECETTE

            impacted.append(recipe_id)
        return impacted
    
    # APPEL A LA FONCTION AU DESSUS POUR CALCULER HISTORIQUE + RECETTE DIRECTEMENT IMPACTÉS
    impacted_article_recipes = _recompute_recipes(impacted_recipes_article) 
    
    
    # TRAITEMENT DES INGREDIENTS ISSUS DE RECETTE (SOUS-RECETTES)

    impacted_article_recipes_set = set(impacted_article_recipes) # CONVERSION EN SET POUR FACILITER LES VERIFICATIONS

    ingredients_sub = [
        ingredient
        for ingredient in ingredients_all
        if (_safe_get(ingredient, "type") or "").upper() in {"SUBRECIPE", "SUBRECIPES"}
        and _safe_get(ingredient, "subrecipe_id") in impacted_article_recipes_set
    ] # FAIS UNE LISTE DE TOUS LES INGRDIENT AYANT UNE SOUS-RECETTE COMPRIS DANS LA LSITE DU DESSUS.

    impacted_recipes_sub: set[UUID] = set()

    # LOGIQUE POUR TRAITER LES INGREDIENTS DE TYPE SOUS-RECETTES
    for ingredient in ingredients_sub:
        subrecipe_id = _safe_get(ingredient, "subrecipe_id")
        subrecipe = recipes_cache.get(subrecipe_id)
        if not subrecipe:
            continue
        purchase_cost_per_portion = _as_decimal(_safe_get(subrecipe, "purchase_cost_per_portion"))
        if purchase_cost_per_portion is None:
            continue
        quantity = _as_decimal(_safe_get(ingredient, "quantity")) or Decimal("1")
        gross_unit_price = purchase_cost_per_portion
        unit_cost = gross_unit_price * quantity
        histories = history_ingredients_service.get_all_history_ingredients(
            filters={
                "ingredient_id": _safe_get(ingredient, "id"),
                "order_by": "date",
                "direction": "asc",
            },
            limit=1000,
        )

        # ON REGAGARDE LES HISTORIQUE REMONTÉ POUR NE PRENDRE QUE CEUX SUPERIEUR A DATE DE FACTURE
        future_histories = [hist for hist in histories if (_as_date(_safe_get(hist, "date")) or date.min) > invoice_date]
        
        #  CALCUL DU VERSION NUMBER
        if histories:
            last_version = _as_decimal(_safe_get(histories[-1], "version_number")) or Decimal("1")
            version_number = last_version + Decimal("0.01")
        else:
            raise LogicError("Aucun historique ingrédient trouvé alors qu'il devrait exister")

        payload = {
            "ingredient_id": _safe_get(ingredient, "id"),
            "establishment_id": establishment_id,
            "recipe_id": _safe_get(ingredient, "recipe_id"),
            "subrecipe_id": subrecipe_id,
            "quantity": quantity,
            "gross_unit_price": gross_unit_price,
            "unit_cost": unit_cost,
            "date": invoice_date,
            "version_number": version_number,
        }
        if not future_histories:
            history_ingredients_service.create_history_ingredients(payload) #CREATION D'UN HISTORIQUE
        else:
            latest = future_histories[-1]
            history_ingredients_service.update_history_ingredients(_safe_get(latest, "id"), {
            "gross_unit_price": gross_unit_price,
            "unit_cost": unit_cost,
        },
        ) # UPDATE DU PLUS RECENT

        # UPDATE DE L'INGREDIENT BASÉ SUR L'HISTORIQUE LE PLUS RECENT (QUI EST FORCEMENT SUR LES DONÉNES QU'ON A CAR CE SONT CELLE DE LA RECETTE ISSU A JOUR)
        ingredients_service.update_ingredients(
            _safe_get(ingredient, "id"),
            {
                "gross_unit_price": payload["gross_unit_price"],
                "unit_cost": payload["unit_cost"],
            },
        )

        ingredient.gross_unit_price = payload["gross_unit_price"]
        ingredient.unit_cost = payload["unit_cost"]
        impacted_recipes_sub.add(_safe_get(ingredient, "recipe_id"))

    # FONCTION MISE À JOUR HISORIQUE+RECETTE
    impacted_sub_recipes = _recompute_recipes(impacted_recipes_sub)


    # CALCULES DES MARGES MOYENNES
    impacted_for_margins = set(impacted_article_recipes) | set(impacted_sub_recipes) #FUSIONNE LES 2 TYÊS DE RECETTES IMPACTÉS
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
                "average_margin": avg_margin,
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

        # MISE A JOUR DE LA MARGE MOYENNE
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

        # MISE A JOUR DE LA MARGE MOYENNE PAR CATEGORIE
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

        # MISE A JOUR DE LA MARGE MOYENNE PAR SOUS-CATEGORIE
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

    # CREATION DES VARIATIONS POUR LES SMS
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
                "old_unit_price": old_price,
                "new_unit_price": entry.unit_price,
                "percentage": percentage,
                "date": invoice_date,
            }
        )
        if variation:
            variations_created.append(variation)

    # ON CHECK SI LE USER PEUT OU VEUT RECEVOIR DES SMS POUR CE SUPPLIER
    can_send_sms = bool(variations_created) and _safe_get(establishment, "active_sms")
    supplier_label_effective = _safe_get(supplier, "label")
    if can_send_sms:
        type_sms = _safe_get(establishment, "type_sms") or "FOOD"
        if not supplier_label_effective:
            can_send_sms = False
        elif type_sms == "FOOD" and supplier_label_effective != "FOOD":
            can_send_sms = False
        elif type_sms == "FOOD & BEVERAGES" and supplier_label_effective not in {"FOOD", "BEVERAGES"}:
            can_send_sms = False


    # CREATION DE L'ALERTE ID QUI SERT DE LOG + ENVOIE À N8N
    alert_id = None
    if can_send_sms:
        trigger = _safe_get(establishment, "sms_variation_trigger") or "ALL"
        threshold = Decimal(str({"ALL": 0, "±5%": 5, "±10%": 10}.get(trigger, 0))) # ON CHECK LES CONDITIONS D'ENVOIE ET SI FOURNISSEUR ELIGIBLE

        filtered_variations = []
        for variation in variations_created:
            pct_value = _as_decimal(_safe_get(variation, "percentage")) or Decimal("0")
            if abs(pct_value) < Decimal("0.1"): #ON EXCLUE LES VARAITIONS QUI SONT A 2 CHIFFRES APRES LA VIRGULE
                continue
            if abs(pct_value) >= threshold:
                filtered_variations.append(variation) # ON EXCLUE LES VARIATIONS NON ACCEPTE PAR LE USER (ALL 5 10)


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
                    recipient_numbers.append(phone) # ON CHERCHER LES PHONE DES USER AU BON STATUS


            if recipient_numbers:
                filtered_variations.sort(
                    key=lambda item: float(_safe_get(item, "percentage") or 0),
                    reverse=True,
                )
                top_variations = filtered_variations[:5]
                extra_count = max(0, len(filtered_variations) - len(top_variations)) #ON LISTE LES 5 VALEURS LES PLUS IMPORTANT ET ON COMPTE LE NOMBRE DE VARIATIONS RESTANTES

                variation_lines = []
                for variation in top_variations:
                    master_article = master_articles_cache.get(_safe_get(variation, "master_article_id"))
                    article_name = _safe_get(master_article, "unformatted_name") or _safe_get(master_article, "name") or "Article"
                    pct_decimal = _as_decimal(_safe_get(variation, "percentage")) or Decimal("0")
                    pct_value = float(pct_decimal)
                    sign = "+" if pct_decimal > 0 else ""
                    variation_lines.append(f"- {article_name} : {sign}{pct_value:.1f}%") # CONSTRUCTION DE LA LIGNE DE VARIATIONS

                block_variations = "\n".join(variation_lines)
                block_extra = f"+{extra_count} autres variations" if extra_count else "" #AJOUT DE "+7 AUTRES VARIATIONS"

                # 1. Recettes impactées directement par les variations (master_article)
                impacted_direct = set()
                for variation in filtered_variations:
                    master_id = _safe_get(variation, "master_article_id")
                    impacted_direct.update(recipes_by_master.get(master_id, set()))
                # 2. Recettes impactées indirectement via les sous-recettes
                impacted_indirect = set(impacted_sub_recipes)
                # 3. Fusion des deux univers
                all_impacted_for_sms = impacted_direct | impacted_indirect
                # 4. Filtre sur les recettes actives seulement
                recipes_impacted_count = len(
                    {
                        rid for rid in all_impacted_for_sms
                        if rid in recipes_cache and _safe_get(recipes_cache[rid], "active")
                    }
                )

                sms_date = _format_sms_date(invoice_date)
                supplier_name_for_sms = _safe_get(supplier, "name") or cleaned_supplier_name
                sms_lines = [f"{supplier_name_for_sms} du {invoice_date}:", "", block_variations]
                
                sms_lines = [
                    f"{supplier_name_for_sms} du {sms_date}:",
                    "",
                    block_variations,
                ]
                
                if block_extra:
                    sms_lines.append(block_extra)
                if recipes_impacted_count:
                    sms_lines.extend(["", f"Impact sur {recipes_impacted_count} recettes."])

                sms_text = "\n".join(line for line in sms_lines if line.strip())

                # CREATION DE L'ALERT LOGS
                for link in user_links:
                    if _safe_get(link, "role") not in {"owner", "admin"}:
                        continue

                    profile = user_profiles_service.get_user_profiles_by_id(_safe_get(link, "user_id"))
                    phone = _safe_get(profile, "phone_sms") if profile else None
                    if not phone:
                        continue

                    alert = alert_logs_service.create_alert_logs(
                        {
                            "establishment_id": establishment_id,
                            "content": sms_text,
                            "sent_to_number": phone,
                            "sent_to_id": _safe_get(link, "user_id"),
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

    import_jobs_service.update_import_job(import_job_id, {"status": "completed"})