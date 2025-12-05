from __future__ import annotations

"""Fusion contrôlée de fournisseurs publics/privés.

Cette implémentation suit la description métier fournie dans le backoffice.
Elle privilégie la sûreté des remappages avant la moindre suppression afin de
limiter les effets de cascade liés aux FK `ON DELETE CASCADE`.
"""

from typing import Any, Dict, Iterable, List, Set
from uuid import UUID

from app.services import (
    articles_service,
    financial_ingredients_service,
    history_ingredients_service,
    ingredients_service,
    invoices_service,
    market_articles_service,
    market_master_articles_service,
    market_supplier_alias_service,
    master_articles_service,
    supplier_merge_request_service,
    suppliers_service,
    variations_service,
)


class LogicError(Exception):
    """Erreur métier dédiée aux logiques WRITE pour la fusion de fournisseurs."""


def _paginate(fetcher, *, filters: Dict[str, Any], page_size: int = 500) -> List[Any]:
    page = 1
    collected: List[Any] = []
    previous_batch_ids: List[Any] | None = None
    while True:
        batch = fetcher(filters=filters, limit=page_size, page=page)
        if not batch:
            break
        batch_ids = [
            _get_attr(item, "id") if not isinstance(item, dict) else item.get("id")
            for item in batch
        ]
        if previous_batch_ids is not None and batch_ids == previous_batch_ids:
            # Protection contre les fetchers qui ignorent la pagination :
            # on arrête pour éviter les boucles infinies.
            break
        collected.extend(batch)
        if len(batch) < page_size:
            break
        previous_batch_ids = batch_ids
        page += 1
    return collected


def _normalize_uuid_list(raw: Any) -> List[UUID]:
    if raw is None:
        return []
    if isinstance(raw, list):
        return [UUID(str(item)) for item in raw]
    if isinstance(raw, dict):  # stocké en JSONB, potentiellement {"list": [...]} ou similaire
        candidates: Iterable[Any] = raw.values()
        flattened: List[Any] = []
        for value in candidates:
            if isinstance(value, list):
                flattened.extend(value)
            else:
                flattened.append(value)
        return [UUID(str(item)) for item in flattened]
    return [UUID(str(raw))]


def _get_attr(obj: Any, name: str, default: Any = None) -> Any:
    """Récupération tolérante aux dictionnaires ou objets Pydantic."""

    if isinstance(obj, dict):
        return obj.get(name, default)
    return getattr(obj, name, default)


def _unique_by_id(rows: Iterable[Any]) -> List[Any]:
    """Dé-duplique une collection de modèles Supabase par leur attribut `id`."""

    seen: Set[Any] = set()
    uniques: List[Any] = []
    for row in rows:
        row_id = _get_attr(row, "id")
        if row_id in seen:
            continue
        seen.add(row_id)
        uniques.append(row)
    return uniques


def merge_suppliers(*, merge_request_id: UUID) -> Dict[str, Any]:
    """Applique une demande de fusion de fournisseurs.

    Notes importantes :
    - Doit être déclenché uniquement lorsque la requête est déjà acceptée.
    - Ne supprime les entités qu'en fin de parcours et seulement après
      remappage de toutes les références connues.
    """

    merge_request = supplier_merge_request_service.get_supplier_merge_request_by_id(
        merge_request_id
    )
    if not merge_request:
        raise LogicError("Demande de fusion introuvable")
    if _get_attr(merge_request, "status") != "accepted":
        raise LogicError("La demande de fusion doit être au statut 'accepted'")

    source_market_supplier_ids = _normalize_uuid_list(
        _get_attr(merge_request, "source_market_supplier_ids")
    )
    target_market_supplier_id_raw = _get_attr(merge_request, "target_market_supplier_id")
    target_market_supplier_id = (
        UUID(str(target_market_supplier_id_raw)) if target_market_supplier_id_raw else None
    )

    if not source_market_supplier_ids or not target_market_supplier_id:
        raise LogicError("Les fournisseurs source ou cible sont manquants")

    # ------------------------------------------------------------------
    # A) Partie publique : market_* tables
    # ------------------------------------------------------------------
    market_master_merge_map: Dict[UUID, UUID] = {}  # old -> target

    for source_market_supplier_id in source_market_supplier_ids:
        market_masters = _paginate(
            market_master_articles_service.get_all_market_master_articles,
            filters={"market_supplier_id": source_market_supplier_id},
        )

        for master in market_masters:
            existing_targets = _paginate(
                market_master_articles_service.get_all_market_master_articles,
                filters={
                    "market_supplier_id": target_market_supplier_id,
                    "unformatted_name": _get_attr(master, "unformatted_name"),
                },
                page_size=1,
            )
            target_master = existing_targets[0] if existing_targets else None

            if target_master:
                # Remap market_articles vers la cible puis suppression du doublon
                articles = _paginate(
                    market_articles_service.get_all_market_articles,
                    filters={"market_master_article_id": _get_attr(master, "id")},
                )
                for article in articles:
                    market_articles_service.update_market_articles(
                        _get_attr(article, "id"),
                        {
                            "market_supplier_id": target_market_supplier_id,
                            "market_master_article_id": _get_attr(target_master, "id"),
                        },
                    )
                market_master_articles_service.delete_market_master_articles(
                    _get_attr(master, "id")
                )
                market_master_merge_map[_get_attr(master, "id")] = _get_attr(
                    target_master, "id"
                )
            else:
                market_master_articles_service.update_market_master_articles(
                    _get_attr(master, "id"),
                    {"market_supplier_id": target_market_supplier_id},
                )
                articles = _paginate(
                    market_articles_service.get_all_market_articles,
                    filters={"market_master_article_id": _get_attr(master, "id")},
                )
                for article in articles:
                    market_articles_service.update_market_articles(
                        _get_attr(article, "id"),
                        {
                            "market_supplier_id": target_market_supplier_id,
                            "market_master_article_id": _get_attr(master, "id"),
                        },
                    )
                market_master_merge_map[_get_attr(master, "id")] = _get_attr(master, "id")

        aliases = _paginate(
            market_supplier_alias_service.get_all_market_supplier_alias,
            filters={"supplier_market_id": source_market_supplier_id},
        )
        for alias in aliases:
            market_supplier_alias_service.update_market_supplier_alias(
                _get_attr(alias, "id"), {"supplier_market_id": target_market_supplier_id}
            )

    # ------------------------------------------------------------------
    # B) Partie privée : fournisseurs par établissement
    # ------------------------------------------------------------------
    impacted_suppliers = _paginate(
        suppliers_service.get_all_suppliers,
        filters={"market_supplier_id": target_market_supplier_id},
    )
    for source_market_supplier_id in source_market_supplier_ids:
        impacted_suppliers += _paginate(
            suppliers_service.get_all_suppliers,
            filters={"market_supplier_id": source_market_supplier_id},
        )
    impacted_suppliers = _unique_by_id(impacted_suppliers)

    establishment_ids: Set[UUID] = {
        _get_attr(supplier, "establishment_id")
        for supplier in impacted_suppliers
        if _get_attr(supplier, "establishment_id")
    }

    summary = {
        "processed_establishments": [],
        "skipped_establishments": [],
        "master_article_deleted_ids": [],
        "master_article_updated_ids": [],
    }

    for establishment_id in establishment_ids:
        establishment_sources = [
            s
            for s in impacted_suppliers
            if _get_attr(s, "establishment_id") == establishment_id
            and _get_attr(s, "market_supplier_id") in source_market_supplier_ids
        ]
        establishment_targets = [
            s
            for s in impacted_suppliers
            if _get_attr(s, "establishment_id") == establishment_id
            and _get_attr(s, "market_supplier_id") == target_market_supplier_id
        ]

        if not establishment_sources:
            summary["skipped_establishments"].append(establishment_id)
            continue

        target_supplier = establishment_targets[0] if establishment_targets else None
        master_article_merge_map: Dict[UUID, UUID] = {}

        for source_supplier in establishment_sources:
            if not target_supplier:
                suppliers_service.update_suppliers(
                    _get_attr(source_supplier, "id"),
                    {"market_supplier_id": target_market_supplier_id},
                )
                target_supplier = suppliers_service.get_suppliers_by_id(
                    _get_attr(source_supplier, "id")
                )

            master_articles = _paginate(
                master_articles_service.get_all_master_articles,
                filters={"supplier_id": _get_attr(source_supplier, "id")},
            )

            for master_article in master_articles:
                existing_target_masters = _paginate(
                    master_articles_service.get_all_master_articles,
                    filters={
                        "supplier_id": _get_attr(target_supplier, "id"),
                        "unformatted_name": _get_attr(master_article, "unformatted_name"),
                    },
                    page_size=1,
                )
                target_master_article = (
                    existing_target_masters[0] if existing_target_masters else None
                )

                if target_master_article and _get_attr(target_master_article, "id") != _get_attr(
                    master_article, "id"
                ):
                    articles = _paginate(
                        articles_service.get_all_articles,
                        filters={"master_article_id": _get_attr(master_article, "id")},
                    )
                    for article in articles:
                        articles_service.update_articles(
                            _get_attr(article, "id"),
                            {
                                "supplier_id": _get_attr(target_supplier, "id"),
                                "master_article_id": _get_attr(target_master_article, "id"),
                            },
                        )
                    master_articles_service.delete_master_articles(
                        _get_attr(master_article, "id")
                    )
                    master_article_merge_map[_get_attr(master_article, "id")] = _get_attr(
                        target_master_article, "id"
                    )
                    summary["master_article_deleted_ids"].append(
                        _get_attr(master_article, "id")
                    )
                else:
                    master_articles_service.update_master_articles(
                        _get_attr(master_article, "id"),
                        {
                            "supplier_id": _get_attr(target_supplier, "id"),
                            "market_master_article_id": market_master_merge_map.get(
                                _get_attr(master_article, "market_master_article_id"),
                                _get_attr(master_article, "market_master_article_id"),
                            ),
                        },
                    )
                    articles = _paginate(
                        articles_service.get_all_articles,
                        filters={"master_article_id": _get_attr(master_article, "id")},
                    )
                    for article in articles:
                        articles_service.update_articles(
                            _get_attr(article, "id"),
                            {
                                "supplier_id": _get_attr(target_supplier, "id"),
                                "master_article_id": _get_attr(master_article, "id"),
                            },
                        )
                    master_article_merge_map[_get_attr(master_article, "id")] = _get_attr(
                        master_article, "id"
                    )
                    summary["master_article_updated_ids"].append(
                        _get_attr(master_article, "id")
                    )

            if _get_attr(source_supplier, "id") != _get_attr(target_supplier, "id"):
                invoices = _paginate(
                    invoices_service.get_all_invoices,
                    filters={"supplier_id": _get_attr(source_supplier, "id")},
                )
                for invoice in invoices:
                    invoices_service.update_invoices(
                        _get_attr(invoice, "id"),
                        {"supplier_id": _get_attr(target_supplier, "id")},
                    )
                suppliers_service.delete_suppliers(_get_attr(source_supplier, "id"))

        if master_article_merge_map:
            deleted_ids = [
                old_id for old_id, new_id in master_article_merge_map.items() if old_id != new_id
            ]
            ingredients = _paginate(
                ingredients_service.get_all_ingredients,
                filters={
                    "establishment_id": establishment_id,
                    "type": "ARTICLE",
                },
            )
            for ingredient in ingredients:
                target_master = master_article_merge_map.get(
                    _get_attr(ingredient, "master_article_id")
                )
                if target_master:
                    ingredients_service.update_ingredients(
                        _get_attr(ingredient, "id"),
                        {"master_article_id": target_master},
                    )
                    histories = _paginate(
                        history_ingredients_service.get_all_history_ingredients,
                        filters={"ingredient_id": _get_attr(ingredient, "id")},
                    )
                    for history in histories:
                        history_ingredients_service.update_history_ingredients(
                            _get_attr(history, "id"),
                            {"master_article_id": target_master},
                        )

            financials = _paginate(
                financial_ingredients_service.get_all_financial_ingredients,
                filters={"establishment_id": establishment_id},
            )
            for fin in financials:
                target_master = master_article_merge_map.get(
                    _get_attr(fin, "master_article_id")
                )
                if target_master:
                    financial_ingredients_service.update_financial_ingredients(
                        _get_attr(fin, "id"),
                        {"master_article_id": target_master},
                    )

            for deleted_master_id in deleted_ids:
                variations = _paginate(
                    variations_service.get_all_variations,
                    filters={
                        "establishment_id": establishment_id,
                        "master_article_id": deleted_master_id,
                    },
                )
                for variation in variations:
                    variations_service.update_variations(
                        _get_attr(variation, "id"), {"is_deleted": True}
                    )

        summary["processed_establishments"].append(establishment_id)

    return summary
