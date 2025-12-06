# FONCTION POUR L'IMPORT D'UNE FACTURE

from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set, Tuple
from uuid import UUID

# Services concernés par la logic

from app.services import (
    alert_logs_service,
    articles_service,
    establishments_service,
    financial_reports_service,
    history_ingredients_service,
    history_recipes_service,
    import_job_service as import_jobs_service,
    invoices_rejected_service,
    ingredients_service,
    invoices_service,
    market_articles_service,
    market_master_articles_service,
    market_supplier_alias_service,
    market_suppliers_service,
    master_articles_service,
    recipes_service,
    regex_patterns_service,
    suppliers_service,
    user_establishment_service,
    user_profiles_service,
    variations_service,
)
from app.logic.write.shared.import_articles import (
    ArticleWriteError,
    ArticleEntry as SharedArticleEntry,
    create_articles_from_lines,
)
from app.logic.write.shared.ingredients_history_ingredients import (
    LogicError as IngredientsLogicError,
    update_ingredients_and_history_ingredients,
)
from app.logic.write.shared.recipes_history_recipes import (
    LogicError as RecipesLogicError,
    update_recipes_and_history_recipes,
)
from app.logic.write.shared.recipes_average_margins import recompute_recipe_margins
from app.logic.write.shared.live_score import (
    LiveScoreError,
    create_or_update_live_score,
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
    "lines": [
        {
            "product_name": None,
            "quantity": None,
            "unit": None,
            "unit_price_excl_tax": None,
            "line_total_excl_tax": None,
            "discounts": None,
            "duties_and_taxes": None,
            "gross_unit-price": None,
        }
    ],
    "file": {
        "original_filename": None,
        "mime_type": None,
        "page_count": None,
    },
}


ArticleEntry = SharedArticleEntry


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


def _create_invoice_rejected(import_job: Any, reason: str) -> None:
    payload = {
        "file_path": _safe_get(import_job, "file_path"),
        "rejection_reason": reason,
        "created_by": _safe_get(import_job, "created_by"),
        "updated_by": _safe_get(import_job, "updated_by"),
    }
    invoices_rejected_service.create_invoices_rejected(payload)


def _reject_invoice_safely(import_job: Any, reason: str) -> None:
    try:
        _create_invoice_rejected(import_job, reason)
    except Exception:
        # La création d'une facture rejetée ne doit pas masquer l'erreur initiale
        pass


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
    import_job = import_jobs_service.get_import_job_by_id(import_job_id)
    try:
        _import_invoice_from_import_job(import_job_id, import_job)
    except Exception as exc:
        _reject_invoice_safely(import_job, str(exc))
        import_jobs_service.update_import_job(import_job_id, {"status": "error"})
        raise


def _import_invoice_from_import_job(import_job_id: UUID, import_job: Any) -> None:
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

    try:
        articles_result = create_articles_from_lines(
            establishment_id=establishment_id,
            supplier_id=supplier_id,
            market_supplier_id=market_supplier_id,
            invoice_id=invoice_id,
            invoice_date=invoice_date,
            lines=lines_block,
            invoice_path=_safe_get(import_job, "file_path"),
        )
    except ArticleWriteError as exc:
        raise LogicError(str(exc)) from exc

    master_article_ids = _unique(articles_result["master_article_ids"])
    articles_by_master = articles_result["articles_by_master"]
    articles_created = articles_result["articles_created"]
    master_articles_cache = articles_result["master_articles_cache"]


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

# LISTE DES INGREDIENTS IMPACTÉS
    ingredient_ids = [
        _safe_get(ing, "id")
        for ing in ingredients_all
        if _safe_get(ing, "type") == "ARTICLE"
        and _safe_get(ing, "master_article_id") in master_article_ids
        and _safe_get(ing, "id")
    ]

    try:
        ingredients_result = update_ingredients_and_history_ingredients(
            establishment_id=establishment_id,
            ingredient_ids=ingredient_ids,
            trigger="import",
            target_date=invoice_date,
            invoice_id=invoice_id,
        )
    except IngredientsLogicError as exc:
        raise LogicError(str(exc)) from exc

    impacted_recipes_article = set(ingredients_result.get("recipes_directly_impacted", set()))
    impacted_recipes_sub = set(ingredients_result.get("recipes_indirectly_impacted", set()))

    try:
        recipes_result = update_recipes_and_history_recipes(
            establishment_id=establishment_id,
            recipe_ids=list(impacted_recipes_article | impacted_recipes_sub),
            target_date=invoice_date,
            trigger="invoices",
        )
    except RecipesLogicError as exc:
        raise LogicError(str(exc)) from exc

    impacted_article_recipes = list(recipes_result.get("all_recipes", set()))
    impacted_sub_recipes = list(recipes_result.get("recipes_with_subrecipes", set()))

    recompute_recipe_margins(
        establishment_id=establishment_id,
        recipe_ids=list(set(impacted_article_recipes) | set(impacted_sub_recipes)),
        target_date=invoice_date,
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

    has_financial_report = bool(
        financial_reports_service.get_all_financial_reports(
            filters={"establishment_id": establishment_id},
            limit=1,
        )
    )

    if has_financial_report:
        try:
            create_or_update_live_score(establishment_id=establishment_id)
        except LiveScoreError as exc:
            raise LogicError(str(exc)) from exc

    import_jobs_service.update_import_job(import_job_id, {"status": "completed"})
