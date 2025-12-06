from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, Iterable, List, Optional, Sequence, Set
from uuid import UUID

from app.logic.write.shared.ingredients_history_ingredients import (
    LogicError as IngredientsLogicError,
    update_ingredients_and_history_ingredients,
)
from app.logic.write.shared.live_score import LiveScoreError, create_or_update_live_score
from app.logic.write.shared.recipes_average_margins import recompute_recipe_margins
from app.logic.write.shared.recipes_history_recipes import (
    LogicError as RecipesLogicError,
    update_recipes_and_history_recipes,
)
from app.services import (
    articles_service,
    financial_reports_service,
    ingredients_service,
    invoices_service,
    master_articles_service,
)


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE."""


def _safe_get(obj: Any, key: str) -> Any:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)


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


def _unique(sequence: Iterable[UUID]) -> List[UUID]:
    seen: Set[UUID] = set()
    ordered: List[UUID] = []
    for item in sequence:
        if item and item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


def apply_manual_invoice_effects(
    establishment_id: UUID,
    invoice_date: date,
    master_article_ids: Sequence[UUID],
    invoice_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    Applique uniquement les effets d'une facture sur :
      - ingrédients (ARTICLE et SUBRECIPE) + historiques
      - recettes impactées + historiques
      - marges moyennes des recettes
      - live_score (si un reporting financier existe)

    Ne touche PAS aux suppliers, invoices, articles, variations, SMS, alert_logs, etc.
    """

    if not establishment_id:
        raise LogicError("establishment_id requis")
    if not invoice_date:
        raise LogicError("invoice_date requis")
    if not master_article_ids:
        # Rien à faire si aucun master_article n'est concerné
        return {
            "ingredient_ids_article": [],
            "ingredient_ids_subrecipes": [],
            "impacted_article_recipes": [],
            "impacted_sub_recipes": [],
        }

    # Normalisation de la liste des master_articles
    master_article_ids_set: Set[UUID] = {m for m in master_article_ids if m}

    # 1) Remontée de tous les ingrédients de l'établissement
    ingredients_all = ingredients_service.get_all_ingredients(
        filters={"establishment_id": establishment_id},
        limit=10000,
    )

    impacted_article_recipes: Set[UUID] = set()
    impacted_sub_recipes: Set[UUID] = set()

    # 2) Ingrédients ARTICLE impactés par les master_articles de la facture
    ingredient_ids_article: List[UUID] = [
        _safe_get(ing, "id")
        for ing in ingredients_all
        if _safe_get(ing, "type") == "ARTICLE"
        and _safe_get(ing, "master_article_id") in master_article_ids_set
        and _safe_get(ing, "id")
    ]

    if ingredient_ids_article:
        # 2.a) Mise à jour ingrédients ARTICLE + historiques
        try:
            ingredients_result_article = update_ingredients_and_history_ingredients(
                establishment_id=establishment_id,
                ingredient_ids=ingredient_ids_article,
                trigger="import",  # même trigger que l'import classique
                target_date=invoice_date,
                invoice_id=invoice_id,
            )
        except IngredientsLogicError as exc:
            raise LogicError(str(exc)) from exc

        impacted_recipes_from_articles = (
            set(ingredients_result_article.get("recipes_directly_impacted", set()))
            | set(ingredients_result_article.get("recipes_indirectly_impacted", set()))
        )

        # 2.b) Mise à jour recettes impactées directement par les ARTICLES
        if impacted_recipes_from_articles:
            try:
                recipes_result_article = update_recipes_and_history_recipes(
                    establishment_id=establishment_id,
                    recipe_ids=list(impacted_recipes_from_articles),
                    target_date=invoice_date,
                    trigger="invoices",  # cohérent avec l'import par facture
                )
            except RecipesLogicError as exc:
                raise LogicError(str(exc)) from exc

            impacted_article_recipes |= set(recipes_result_article.get("all_recipes", set()))
            impacted_sub_recipes |= set(
                recipes_result_article.get("recipes_with_subrecipes", set())
            )

    # 3) Ingrédients SUBRECIPE dont la sous-recette fait partie des recettes impactées
    ingredient_ids_subrecipes: List[UUID] = [
        _safe_get(ing, "id")
        for ing in ingredients_all
        if _safe_get(ing, "type") == "SUBRECIPE"
        and _safe_get(ing, "subrecipe_id") in impacted_article_recipes
        and _safe_get(ing, "id")
    ]

    if ingredient_ids_subrecipes:
        # 3.a) Mise à jour ingrédients SUBRECIPE + historiques
        try:
            ingredients_result_sub = update_ingredients_and_history_ingredients(
                establishment_id=establishment_id,
                ingredient_ids=ingredient_ids_subrecipes,
                trigger="import",
                target_date=invoice_date,
                invoice_id=invoice_id,
            )
        except IngredientsLogicError as exc:
            raise LogicError(str(exc)) from exc

        impacted_recipes_from_sub = (
            set(ingredients_result_sub.get("recipes_directly_impacted", set()))
            | set(ingredients_result_sub.get("recipes_indirectly_impacted", set()))
        )

        # 3.b) Mise à jour recettes parentes impactées via les sous-recettes
        if impacted_recipes_from_sub:
            try:
                recipes_result_sub = update_recipes_and_history_recipes(
                    establishment_id=establishment_id,
                    recipe_ids=list(impacted_recipes_from_sub),
                    target_date=invoice_date,
                    trigger="invoices",
                )
            except RecipesLogicError as exc:
                raise LogicError(str(exc)) from exc

            impacted_article_recipes |= set(recipes_result_sub.get("all_recipes", set()))
            impacted_sub_recipes |= set(
                recipes_result_sub.get("recipes_with_subrecipes", set())
            )

    # 4) Recalcul des marges sur l’ensemble des recettes impactées
    all_recipes_for_margins = list(impacted_article_recipes | impacted_sub_recipes)

    if all_recipes_for_margins:
        recompute_recipe_margins(
            establishment_id=establishment_id,
            recipe_ids=all_recipes_for_margins,
            target_date=invoice_date,
        )

    # 5) Live score uniquement si un reporting financier existe
    has_financial_report = bool(
        financial_reports_service.get_all_financial_reports(
            filters={"establishment_id": establishment_id},
            limit=1,
        )
    )

    if has_financial_report:
        try:
            create_or_update_live_score(establishment_id=establishment_id)
        except LiveScoreError:
            # on ne bloque pas l'import manuel sur un échec de live_score
            pass

    # Retour d’information utile pour le front / logs
    return {
        "ingredient_ids_article": ingredient_ids_article,
        "ingredient_ids_subrecipes": ingredient_ids_subrecipes,
        "impacted_article_recipes": list(impacted_article_recipes),
        "impacted_sub_recipes": list(impacted_sub_recipes),
        "all_recipes_for_margins": all_recipes_for_margins,
    }


def import_manual_invoice(invoice_id: UUID) -> Dict[str, Any]:
    """Impacte les ingrédients et recettes après création manuelle d'une facture."""

    invoice = invoices_service.get_invoices_by_id(invoice_id)
    if not invoice:
        raise LogicError("Facture introuvable")

    establishment_id = _safe_get(invoice, "establishment_id")
    if not establishment_id:
        raise LogicError("Facture sans établissement")

    invoice_date = _as_date(_safe_get(invoice, "invoice_date")) or _as_date(
        _safe_get(invoice, "date")
    )
    if not invoice_date:
        raise LogicError("Date de facture manquante")

    # Lignes d'articles reliées à la facture
    invoice_articles = articles_service.get_all_articles(
        filters={"invoice_id": invoice_id},
        limit=10000,
    )
    if not invoice_articles:
        raise LogicError("Facture sans lignes d'articles")

    # Cohérence établissement ↔ articles
    invalid_articles = [
        art
        for art in invoice_articles
        if _safe_get(art, "establishment_id")
        and _safe_get(art, "establishment_id") != establishment_id
    ]
    if invalid_articles:
        raise LogicError("Lignes de facture non reliées à l'établissement")

    # master_article_ids de la facture (sans None)
    master_article_ids = _unique(
        [
            _safe_get(article, "master_article_id")
            for article in invoice_articles
            if _safe_get(article, "master_article_id") is not None
        ]
    )
    if not master_article_ids:
        raise LogicError("Aucun master article relié à la facture")

    # Master articles appartenant à l'établissement
    master_ids_for_establishment = {
        _safe_get(m, "id")
        for m in master_articles_service.get_all_master_articles(
            filters={"establishment_id": establishment_id},
            limit=10000,
        )
    }

    # Validation de la présence des master_articles de la facture
    missing_master_ids = [mid for mid in master_article_ids if mid not in master_ids_for_establishment]
    if missing_master_ids:
        raise LogicError("Master articles manquants pour l'établissement")

    return apply_manual_invoice_effects(
        establishment_id=establishment_id,
        invoice_date=invoice_date,
        master_article_ids=master_article_ids,
        invoice_id=invoice_id,
    )
