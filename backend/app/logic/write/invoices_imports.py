from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Any, Dict, Iterable, List, Optional, Tuple
from uuid import UUID

from app.services import (
    import_jobs_service,
    regex_patterns_service,
    market_suppliers_service,
    market_supplier_alias_service,
    suppliers_service,
    invoices_service,
    market_master_articles_service,
    market_articles_service,
    master_articles_service,
    articles_service,
    ingredients_service,
    history_ingredients_service,
    recipes_service,
    history_recipes_service,
    variations_service,
    alert_logs_service,
    establishments_service,
)

# ---------------------------------------------------------------------------
#  Exception métier locale
# ---------------------------------------------------------------------------


class LogicError(Exception):
    """Erreur métier pour les logics WRITE (import, etc.)."""
    pass


# ---------------------------------------------------------------------------
#  Helpers de calcul – volontairement simples et centralisés
# ---------------------------------------------------------------------------

@dataclass
class ArticleCost:
    """Coût d'achat consolidé pour un master_article à une date donnée."""
    gross_unit_price: Decimal       # prix brut unitaire (après remise, avec taxes éventuelles)
    unit_cost: Decimal              # coût net unitaire (matière) pour l’ingrédient
    unit_cost_per_portion: Decimal  # coût matière par portion d’ingrédient
    loss_value: Decimal             # valeur des pertes pour 1 unité d’ingrédient


def _decimal(v: Any) -> Decimal:
    if v is None:
        return Decimal("0")
    if isinstance(v, Decimal):
        return v
    return Decimal(str(v))


def compute_article_cost_from_lines(
    lines: List[Dict[str, Any]],
) -> Dict[UUID, ArticleCost]:
    """
    Agrège les lignes OCR par master_article_id pour calculer un coût moyen.

    Hypothèse : chaque line dict contient :
      - master_article_id (déjà résolu)
      - quantity
      - unit_price_excl_tax
      - line_total_excl_tax
      - discounts
      - duties_and_taxes

    Le but est d’obtenir pour chaque master_article_id un ArticleCost
    utilisable pour les INGREDIENTS ARTICLE (étape 9).
    """
    by_master: Dict[UUID, List[Dict[str, Any]]] = {}
    for line in lines:
        ma_id = line.get("master_article_id")
        if not ma_id:
            continue
        by_master.setdefault(ma_id, []).append(line)

    results: Dict[UUID, ArticleCost] = {}
    for ma_id, ma_lines in by_master.items():
        total_qty = Decimal("0")
        total_excl = Decimal("0")
        total_discounts = Decimal("0")
        total_duties = Decimal("0")

        for l in ma_lines:
            total_qty += _decimal(l.get("quantity"))
            total_excl += _decimal(l.get("line_total_excl_tax"))
            total_discounts += _decimal(l.get("discounts"))
            total_duties += _decimal(l.get("duties_and_taxes"))

        if total_qty <= 0:
            # Sécurité : évite une division par zéro ; on passe l’article.
            continue

        # Coût matière net = total HT – remises + droits/taxes
        net_excl = total_excl - total_discounts + total_duties
        gross_unit_price = net_excl / total_qty
        unit_cost = gross_unit_price  # ici, matière brute = prix unitaire net
        # Pour simplifier : on considère 1 unité d’ingrédient = 1 unité article
        unit_cost_per_portion = unit_cost
        loss_value = Decimal("0")  # les pertes seront gérées via percentage_loss sur l’ingrédient

        results[ma_id] = ArticleCost(
            gross_unit_price=gross_unit_price,
            unit_cost=unit_cost,
            unit_cost_per_portion=unit_cost_per_portion,
            loss_value=loss_value,
        )

    return results


def compute_recipe_cost_from_ingredients(
    ingredients: Iterable[Any],
) -> Decimal:
    """
    Recalcule le coût de production d’une recette à partir de ses ingrédients.

    Hypothèse : chaque ingredient possède :
      - unit_cost
      - quantity
      - unit_cost_per_portion_recipe (optionnel selon votre modèle)
    """
    total = Decimal("0")
    for ing in ingredients:
        qty = _decimal(getattr(ing, "quantity", 1))
        unit_cost = _decimal(getattr(ing, "unit_cost", 0))
        total += qty * unit_cost
    return total


def compute_recommended_prices(
    material_cost: Decimal,
    establishment: Any,
) -> Tuple[Decimal, Decimal, Decimal]:
    """
    Calcule prix TTC conseillé + HT + TVA à partir du coût matière et
    de la politique de marge de l’établissement.

    Hypothèse simple :
      - établissement possède des champs de marge cibles, ex :
        establishment.target_food_cost_ratio (0.25 → 25%)
    """
    if material_cost <= 0:
        return Decimal("0"), Decimal("0"), Decimal("0")

    # Hypothèse : ratio cible stocké sur l’établissement
    ratio = _decimal(getattr(establishment, "target_food_cost_ratio", Decimal("0.3")))
    if ratio <= 0:
        ratio = Decimal("0.3")

    # Prix conseillé TTC = coût / ratio
    recommended_incl_tax = (material_cost / ratio).quantize(Decimal("0.01"))
    vat_rate = _decimal(getattr(establishment, "default_vat_rate", Decimal("10")))
    vat_ratio = vat_rate / Decimal("100")

    price_excl = (recommended_incl_tax / (Decimal("1") + vat_ratio)).quantize(
        Decimal("0.01")
    )
    price_tax = recommended_incl_tax - price_excl
    return recommended_incl_tax, price_excl, price_tax


# ---------------------------------------------------------------------------
#  LOGIC PRINCIPALE : import_invoice_from_import_job
# ---------------------------------------------------------------------------

def import_invoice_from_import_job(import_job_id: UUID) -> None:
    """
    Logic WRITE : impact complet d’un import_jobs (une facture OCR)
    sur l’écosystème RAVY.

    Étapes métier (cf. doc logic_import_facture_full_v_2) :
      1. Contexte / préconditions
      2. Récupération import_job + contrôles
      3. Extraction OCR (invoice / supplier / lines)
      4. Gestion supplier (market + privé)
      5. Création / mise à jour facture
      6. Gestion market_master_articles + market_articles
      7. Gestion master_articles privés + articles
      8. INGREDIENTS + HISTORY_INGREDIENTS (ARTICLE)
      9. RECIPES + HISTORY_RECIPES (ARTICLE)
     10. INGREDIENTS SUBRECIPES + HISTORY_INGREDIENTS SUBRECIPES
     11. RECIPES SUBRECIPES + HISTORY_RECIPES SUBRECIPES
     12. Variations + Alertes SMS
     13. Finalisation du job (COMPLETED / ERROR)

    NB : traitement strictement séquentiel, non concurrent,
    une seule exécution par import_job.
    """

    # ------------------------------------------------------------------
    # 2. RÉCUPÉRATION IMPORT_JOB + PRÉCONDITIONS
    # ------------------------------------------------------------------
    import_job = import_jobs_service.get_import_jobs_by_id(import_job_id)

    if import_job.status in ["COMPLETED", "ERROR"]:
        raise LogicError("Job déjà traité ou en erreur définitive")

    if import_job.ocr_result_json is None:
        raise LogicError("OCR absent")

    est_id: UUID = import_job.establishment_id

    # ------------------------------------------------------------------
    # 3. EXTRACTION DES BLOCS OCR
    # ------------------------------------------------------------------
    i_ocr = import_job.ocr_result_json["invoice"]
    s_ocr = import_job.ocr_result_json["supplier"]
    l_ocr = import_job.ocr_result_json["lines"]

    invoice_date: date = i_ocr["invoice_date"]

    # ------------------------------------------------------------------
    # 4. RÉCUPÉRATION DES REGEX (supplier + master_article)
    # ------------------------------------------------------------------
    regex_supplier = regex_patterns_service.get_all_regex_patterns(
        filters={"type": "supplier_name"}, limit=1
    )[0]
    regex_master_article = regex_patterns_service.get_all_regex_patterns(
        filters={"type": "market_master_article_name"}, limit=1
    )[0]

    # ------------------------------------------------------------------
    # 5. GESTION SUPPLIER (market + privé)
    # ------------------------------------------------------------------
    # 5.1 Nettoyage nom fournisseur via regex
    cleaned_supplier_name = regex_supplier.apply(s_ocr["name"])

    # 5.2 Supplier marché global (market_suppliers + market_supplier_alias)
    # Recherche d’un supplier marché existant via alias
    existing_alias = market_supplier_alias_service.get_all_market_supplier_alias(
        filters={"alias": cleaned_supplier_name}, limit=1
    )
    if existing_alias:
        market_supplier_id = existing_alias[0].market_supplier_id
    else:
        # Création du market_supplier
        payload_market_sup = {
            "name": cleaned_supplier_name,
            "siret": s_ocr["siret"],
            "vat_number": s_ocr["vat_number"],
            "emails": s_ocr["emails"],
            "phone_numbers": s_ocr["phone_numbers"],
            "street": s_ocr["street"],
            "postcode": s_ocr["postcode"],
            "city": s_ocr["city"],
            "country_code": s_ocr["country_code"],
            "label": "BEVERAGES" if import_job.is_beverage else None,
        }
        market_supplier = market_suppliers_service.create_market_suppliers(
            payload_market_sup
        )
        market_supplier_id = market_supplier.id

        market_supplier_alias_service.create_market_supplier_alias(
            {
                "market_supplier_id": market_supplier_id,
                "alias": cleaned_supplier_name,
            }
        )

    # 5.3 Supplier privé lié à l’établissement
    supplier = suppliers_service.get_all_suppliers(
        filters={
            "establishment_id": est_id,
            "market_supplier_id": market_supplier_id,
        },
        limit=1,
    )
    if supplier:
        supplier_id = supplier[0].id
    else:
        payload_supplier = {
            "establishment_id": est_id,
            "market_supplier_id": market_supplier_id,
            "internal_name": cleaned_supplier_name,
        }
        new_supplier = suppliers_service.create_suppliers(payload_supplier)
        supplier_id = new_supplier.id

    # ------------------------------------------------------------------
    # 6. FACTURE (invoices)
    # ------------------------------------------------------------------
    invoice = invoices_service.get_all_invoices(
        filters={
            "establishment_id": est_id,
            "supplier_id": supplier_id,
            "invoice_number": i_ocr["invoice_number"],
        },
        limit=1,
    )

    if invoice:
        # Facture existante → mise à jour
        invoice = invoice[0]
        invoice_id = invoice.id
        payload_invoice_update = {
            "date": i_ocr["invoice_date"],
            "due_date": i_ocr.get("due_date"),
            "currency": i_ocr["currency"],
            "total_excl_tax": i_ocr["total_excl_tax"],
            "total_incl_tax": i_ocr["total_incl_tax"],
            "total_vat": i_ocr["total_vat"],
            "vat_breakdown": i_ocr["vat_breakdown"],
        }
        invoices_service.update_invoices(invoice_id, payload_invoice_update)
    else:
        payload_invoice_create = {
            "establishment_id": est_id,
            "supplier_id": supplier_id,
            "invoice_number": i_ocr["invoice_number"],
            "date": i_ocr["invoice_date"],
            "due_date": i_ocr.get("due_date"),
            "currency": i_ocr["currency"],
            "total_excl_tax": i_ocr["total_excl_tax"],
            "total_incl_tax": i_ocr["total_incl_tax"],
            "total_vat": i_ocr["total_vat"],
            "vat_breakdown": i_ocr["vat_breakdown"],
        }
        invoice = invoices_service.create_invoices(payload_invoice_create)
        invoice_id = invoice.id

    # ------------------------------------------------------------------
    # 7. LIGNES FACTURE → MARKET_MASTER_ARTICLES / MARKET_ARTICLES
    #    + MASTER_ARTICLES PRIVÉS + ARTICLES
    # ------------------------------------------------------------------
    # 7.1 Préparation des lignes avec master_article_id résolu
    master_article_ids: List[UUID] = []
    lines_with_master: List[Dict[str, Any]] = []
    article_ids_by_master: Dict[UUID, List[UUID]] = {}

    for line in l_ocr:
        # a) Résolution du market_master_article par regex/nom
        cleaned_name = regex_master_article.apply(line["description"])
        mma = market_master_articles_service.get_all_market_master_articles(
            filters={"clean_name": cleaned_name}, limit=1
        )
        if mma:
            market_master_article_id = mma[0].id
        else:
            # Création d’un nouveau market_master_article
            payload_mma = {
                "name": line["description"],
                "clean_name": cleaned_name,
                "family": line["family"],
                "subfamily": line["subfamily"],
            }
            mma_obj = market_master_articles_service.create_market_master_articles(
                payload_mma
            )
            market_master_article_id = mma_obj.id

        # b) MARKET_ARTICLE lié au supplier marché
        ma = market_articles_service.get_all_market_articles(
            filters={
                "market_master_article_id": market_master_article_id,
                "market_supplier_id": market_supplier_id,
            },
            limit=1,
        )
        if ma:
            market_article_id = ma[0].id
            # mise à jour des prix
            payload_ma_update = {
                "last_unit_price_excl_tax": line["unit_price_excl_tax"],
                "last_total_excl_tax": line["line_total_excl_tax"],
                "last_invoice_date": invoice_date,
            }
            market_articles_service.update_market_articles(
                market_article_id, payload_ma_update
            )
        else:
            payload_ma_create = {
                "market_master_article_id": market_master_article_id,
                "market_supplier_id": market_supplier_id,
                "unit": line["unit"],
                "barcode": line["barcode"],
                "supplier_sku": line["supplier_sku"],
                "last_unit_price_excl_tax": line["unit_price_excl_tax"],
                "last_total_excl_tax": line["line_total_excl_tax"],
                "last_invoice_date": invoice_date,
            }
            ma_obj = market_articles_service.create_market_articles(payload_ma_create)
            market_article_id = ma_obj.id

        # c) MASTER_ARTICLE privé (lié à l’établissement)
        master_article = master_articles_service.get_all_master_articles(
            filters={
                "establishment_id": est_id,
                "market_master_article_id": market_master_article_id,
            },
            limit=1,
        )
        if master_article:
            master_article_id = master_article[0].id
        else:
            payload_master_article_create = {
                "establishment_id": est_id,
                "market_master_article_id": market_master_article_id,
                "unit": line["unit"],
                "barcode": line["barcode"],
                "supplier_sku": line["supplier_sku"],
            }
            new_ma = master_articles_service.create_master_articles(
                payload_master_article_create
            )
            master_article_id = new_ma.id

        master_article_ids.append(master_article_id)

        # d) ARTICLE de facture
        payload_article = {
            "establishment_id": est_id,
            "master_article_id": master_article_id,
            "invoice_id": invoice_id,
            "quantity": line["quantity"],
            "unit": line["unit"],
            "unit_price": line["unit_price_excl_tax"],
            "total_excl_tax": line["line_total_excl_tax"],
            "vat_rate": line["vat_rate"],
            "discounts": line["discounts"],
            "duties_and_taxes": line["duties_and_taxes"],
        }
        article = articles_service.create_articles(payload_article)
        article_id = article.id

        article_ids_by_master.setdefault(master_article_id, []).append(article_id)

        # On enrichit la ligne pour la suite (INGREDIENTS)
        line_with_master = dict(line)
        line_with_master["master_article_id"] = master_article_id
        lines_with_master.append(line_with_master)

    # Liste unique des master_article impactés
    master_article_ids = list(set(master_article_ids))

    # Calcul pré-agrégé des coûts par master_article (pour INGREDIENTS)
    article_costs_by_master = compute_article_cost_from_lines(lines_with_master)

    # ------------------------------------------------------------------
    # 8. INGREDIENTS (ARTICLE) + HISTORY_INGREDIENTS (ARTICLE)
    # ------------------------------------------------------------------
    ingredients_article = ingredients_service.get_all_ingredients(
        filters={
            "establishment_id": est_id,
            "type": "ARTICLE",
            "master_article_id__in": master_article_ids,
        }
    )

    recipes_article_impacted: List[UUID] = []

    if ingredients_article:
        for ingredient in ingredients_article:
            master_article_id = ingredient.master_article_id
            article_cost = article_costs_by_master.get(master_article_id)
            if not article_cost:
                # Aucun coût calculé pour ce master_article → on skippe
                continue

            # 8.1 Récupération des history_ingredients existants (triés par date)
            hist_list = history_ingredients_service.get_all_history_ingredients(
                filters={"ingredient_id": ingredient.id},
                order_by=["date"],
            )

            # 8.2 Recherche de l’historique de référence (antériorité stricte)
            h_prev = None
            h_next = None
            for h in hist_list:
                if h.date <= invoice_date:
                    h_prev = h
                elif h.date >= invoice_date and h_next is None:
                    h_next = h

            # 8.3 Construction du nouveau history_ingredient à la date de facture
            # Utilisation du ArticleCost comme base, en respectant percentage_loss
            percentage_loss = _decimal(getattr(ingredient, "percentage_loss", 0))
            # coût matière unitaire “brut” (sans perte)
            base_unit_cost = article_cost.unit_cost
            loss_value = (base_unit_cost * percentage_loss / Decimal("100")).quantize(
                Decimal("0.0001")
            )
            unit_cost_after_loss = base_unit_cost + loss_value

            payload_history_new = {
                "ingredient_id": ingredient.id,
                "date": invoice_date,
                "gross_unit_price": article_cost.gross_unit_price,
                "unit_cost": unit_cost_after_loss,
                "unit_cost_per_portion_recipe": article_cost.unit_cost_per_portion,
                "loss_value": loss_value,
            }
            new_hist = history_ingredients_service.create_history_ingredients(
                payload_history_new
            )

            # 8.4 Si un h_next existait, on l’insère après (l’historique reste trié)
            # → pas besoin d’action spécifique si le service respecte l’ordre par date.
            # Mais si vous avez une logique métier particulière, c’est ici.

            # 8.5 Mise à jour de l’INGREDIENT courant avec le dernier historique
            all_histories = history_ingredients_service.get_all_history_ingredients(
                filters={"ingredient_id": ingredient.id},
                order_by=["date"],
            )
            latest = all_histories[-1]
            payload_update_ing = {
                "gross_unit_price": latest.gross_unit_price,
                "unit_cost": latest.unit_cost,
                "unit_cost_per_portion_recipe": latest.unit_cost_per_portion_recipe,
                "loss_value": latest.loss_value,
            }
            ingredients_service.update_ingredients(ingredient.id, payload_update_ing)

            # On mémorise les recettes impactées par cet ingrédient ARTICLE
            if ingredient.recipe_id:
                recipes_article_impacted.append(ingredient.recipe_id)

    # ------------------------------------------------------------------
    # 9. RECIPES + HISTORY_RECIPES (ARTICLE)
    # ------------------------------------------------------------------
    recipes_article_impacted = list(set(recipes_article_impacted))
    recipes_article = []
    if recipes_article_impacted:
        recipes_article = recipes_service.get_all_recipes(
            filters={"id__in": recipes_article_impacted}
        )

    if recipes_article:
        establishment = establishments_service.get_establishments_by_id(est_id)

        for recipe in recipes_article:
            # 9.1 Récupérer tous les ingrédients de cette recette
            recipe_ingredients = ingredients_service.get_all_ingredients(
                filters={"recipe_id": recipe.id}
            )

            # 9.2 Recalcul du coût matière de la recette
            material_cost = compute_recipe_cost_from_ingredients(recipe_ingredients)

            # 9.3 History_recipes existants (triés)
            hist_list = history_recipes_service.get_all_history_recipes(
                filters={"recipe_id": recipe.id},
                order_by=["date"],
            )

            h_prev = None
            h_next = None
            for h in hist_list:
                if h.date <= invoice_date:
                    h_prev = h
                elif h.date >= invoice_date and h_next is None:
                    h_next = h

            # 9.4 Calcul prix recommandé (selon politique marge établissement)
            (
                recommended_price_incl_tax,
                recommended_price_excl_tax,
                recommended_price_tax,
            ) = compute_recommended_prices(material_cost, establishment)

            # 9.5 Création d’un history_recipes à la date de la facture
            payload_hist_rec = {
                "recipe_id": recipe.id,
                "date": invoice_date,
                "material_cost": material_cost,
                "price_incl_tax": recommended_price_incl_tax,
                "price_excl_tax": recommended_price_excl_tax,
                "price_tax": recommended_price_tax,
            }
            history_recipes_service.create_history_recipes(payload_hist_rec)

            # 9.6 Mise à jour de la recette courante (état actuel)
            payload_recipe_update = {
                "material_cost": material_cost,
                "recommended_price_incl_tax": recommended_price_incl_tax,
                "recommended_price_excl_tax": recommended_price_excl_tax,
                "recommended_price_tax": recommended_price_tax,
            }
            recipes_service.update_recipes(recipe.id, payload_recipe_update)

    # ------------------------------------------------------------------
    # 10. INGREDIENTS SUBRECIPES + HISTORY_INGREDIENTS SUBRECIPES
    # ------------------------------------------------------------------
    # On part des recettes ARTICLE impactées (recipes_article_impacted)
    ingredients_sub = []
    if recipes_article_impacted:
        ingredients_sub = ingredients_service.get_all_ingredients(
            filters={
                "establishment_id": est_id,
                "type": "SUBRECIPES",
                "subrecipe_id__in": recipes_article_impacted,
            }
        )

    recipes_sub_impacted: List[UUID] = []

    if ingredients_sub:
        for ingredient in ingredients_sub:
            # Rappel métier : pas de percentage_loss, pas de loss_value pour SUBRECIPES
            hist_list = history_ingredients_service.get_all_history_ingredients(
                filters={"ingredient_id": ingredient.id},
                order_by=["date"],
            )
            # On cherche seulement un historique futur
            h_future = None
            for h in hist_list:
                if h.date > invoice_date:
                    h_future = h
                    break

            # Récupération de la sous-recette (subrecipe)
            subrecipe = recipes_service.get_recipes_by_id(ingredient.subrecipe_id)
            # Le coût vient directement de la sous-recette : purchase_cost_per_portion
            purchase_cost_per_portion = _decimal(
                getattr(subrecipe, "purchase_cost_per_portion", 0)
            )

            # Création d’un history_ingredient à la date de la facture
            payload_hist_sub = {
                "ingredient_id": ingredient.id,
                "date": invoice_date,
                "gross_unit_price": purchase_cost_per_portion,
                "unit_cost": purchase_cost_per_portion,
                "unit_cost_per_portion_recipe": purchase_cost_per_portion,
            }
            history_ingredients_service.create_history_ingredients(payload_hist_sub)

            # Mise à jour de l’ingredient SUBRECIPES avec le dernier historique
            all_histories = history_ingredients_service.get_all_history_ingredients(
                filters={"ingredient_id": ingredient.id},
                order_by=["date"],
            )
            latest = all_histories[-1]
            payload_update_ing = {
                "gross_unit_price": latest.gross_unit_price,
                "unit_cost": latest.unit_cost,
            }
            ingredients_service.update_ingredients(ingredient.id, payload_update_ing)

            # On mémorise les recettes parent impactées
            if ingredient.recipe_id:
                recipes_sub_impacted.append(ingredient.recipe_id)

    # ------------------------------------------------------------------
    # 11. RECIPES SUBRECIPES + HISTORY_RECIPES SUBRECIPES
    # ------------------------------------------------------------------
    recipes_sub_impacted = list(set(recipes_sub_impacted))
    recipes_sub = []
    if recipes_sub_impacted:
        recipes_sub = recipes_service.get_all_recipes(
            filters={"id__in": recipes_sub_impacted}
        )

    if recipes_sub:
        establishment = establishments_service.get_establishments_by_id(est_id)

        for recipe in recipes_sub:
            rec_ingredients = ingredients_service.get_all_ingredients(
                filters={"recipe_id": recipe.id}
            )
            material_cost = compute_recipe_cost_from_ingredients(rec_ingredients)

            hist_list = history_recipes_service.get_all_history_recipes(
                filters={"recipe_id": recipe.id},
                order_by=["date"],
            )

            # SUBRECIPES : on applique la même mécanique que pour ARTICLE
            (
                recommended_price_incl_tax,
                recommended_price_excl_tax,
                recommended_price_tax,
            ) = compute_recommended_prices(material_cost, establishment)

            payload_hist = {
                "recipe_id": recipe.id,
                "date": invoice_date,
                "material_cost": material_cost,
                "price_incl_tax": recommended_price_incl_tax,
                "price_excl_tax": recommended_price_excl_tax,
                "price_tax": recommended_price_tax,
            }
            history_recipes_service.create_history_recipes(payload_hist)

            payload_recipe_update = {
                "material_cost": material_cost,
                "recommended_price_incl_tax": recommended_price_incl_tax,
                "recommended_price_excl_tax": recommended_price_excl_tax,
                "recommended_price_tax": recommended_price_tax,
            }
            recipes_service.update_recipes(recipe.id, payload_recipe_update)

    # ------------------------------------------------------------------
    # 12. VARIATIONS + ALERTES SMS
    # ------------------------------------------------------------------
    # Cette partie est volontairement compacte :
    # - On compare les nouveaux coûts d’achat (market_articles / article_costs_by_master)
    #   aux anciens costs (via history_ingredients + history_recipes si besoin)
    # - On enregistre les Variations
    # - On déclenche éventuellement des SMS selon la config établissement.
    #
    # Vous pouvez affiner la granularité ici si vous avez une logique
    # plus détaillée dans votre doc.

    # Ex : on boucle sur chaque master_article impacté, on compare le coût
    # actuel vs le dernier coût avant invoice_date, et on stocke delta %
    for master_article_id, article_cost in article_costs_by_master.items():
        # Récupère un éventuel dernier history_ingredient “ancien” pour un ingrédient ARTICLE lié
        ingredients_for_ma = [
            ing
            for ing in ingredients_article
            if ing.master_article_id == master_article_id
        ]
        if not ingredients_for_ma:
            continue

        # On prend le premier ingrédient comme référence pour la variation
        ing_ref = ingredients_for_ma[0]
        old_hist_list = history_ingredients_service.get_all_history_ingredients(
            filters={"ingredient_id": ing_ref.id, "date__lt": invoice_date},
            order_by=["date"],
        )
        if not old_hist_list:
            # Pas d’historique ancien -> impossible de calculer une variation pertinente
            continue

        last_old = old_hist_list[-1]
        old_cost = _decimal(last_old.unit_cost)
        new_cost = article_cost.unit_cost

        if old_cost <= 0:
            continue

        delta_abs = new_cost - old_cost
        delta_pct = (delta_abs / old_cost * Decimal("100")).quantize(
            Decimal("0.01")
        )

        # Enregistrement de la variation
        payload_variation = {
            "establishment_id": est_id,
            "invoice_id": invoice_id,
            "master_article_id": master_article_id,
            "old_unit_cost": old_cost,
            "new_unit_cost": new_cost,
            "variation_percent": delta_pct,
        }
        variations_service.create_variations(payload_variation)

        # Gestion SMS éventuel
        # (rappel : la config SMS est portée par l’établissement : active_sms, type_sms, sms_variation_trigger)
        establishment = establishments_service.get_establishments_by_id(est_id)
        if not getattr(establishment, "active_sms", False):
            continue

        # Filtre FOOD / FOOD & BEVERAGES
        type_sms = getattr(establishment, "type_sms", "FOOD")
        if type_sms == "FOOD" and import_job.is_beverage:
            # On ignore les variations provenant d’un supplier BEVERAGES si
            # la conf est FOOD uniquement.
            continue

        trigger = getattr(establishment, "sms_variation_trigger", "ALL")
        threshold_map = {
            "ALL": Decimal("0"),
            "±5%": Decimal("5"),
            "±10%": Decimal("10"),
        }
        threshold = threshold_map.get(trigger, Decimal("0"))
        if abs(delta_pct) < threshold:
            continue

        # Ici : variation jugée significative → on crée un alert_log
        message = (
            f"Variation de prix détectée sur un produit : {delta_pct}% "
            f"(ancien coût {old_cost}€, nouveau coût {new_cost}€)."
        )
        payload_alert = {
            "establishment_id": est_id,
            "type": "SMS_VARIATION",
            "content": message,
            "sent_to_number": getattr(establishment, "sms_phone_number", None),
            "payload": {
                "invoice_id": str(invoice_id),
                "master_article_id": str(master_article_id),
                "delta_percent": str(delta_pct),
                "old_unit_cost": str(old_cost),
                "new_unit_cost": str(new_cost),
            },
        }
        alert_logs_service.create_alert_logs(payload_alert)

    # ------------------------------------------------------------------
    # 13. FINALISATION DU JOB
    # ------------------------------------------------------------------
    import_jobs_service.update_import_jobs(
        import_job_id,
        {"status": "COMPLETED"},
    )
