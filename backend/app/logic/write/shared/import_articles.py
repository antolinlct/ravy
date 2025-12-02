"""Creation/update helpers for articles and related master records."""

from __future__ import annotations

import re
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, Iterable, List, Optional, Sequence
from uuid import UUID

from app.services import (
    articles_service,
    market_articles_service,
    market_master_articles_service,
    master_articles_service,
    regex_patterns_service,
)


class ArticleWriteError(Exception):
    """Dedicated error for article write operations."""


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_get(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _apply_regex(pattern: Optional[str], value: Optional[str], pattern_type: Optional[str] = None) -> Optional[str]:
    if not value:
        return None

    # Trim début/fin uniquement
    txt = value.strip()

    # Normalisation forte uniquement pour market_master_article_name
    if pattern_type == "market_master_article_name":
        txt = unicodedata.normalize("NFKD", txt)
        txt = "".join(c for c in txt if not unicodedata.combining(c))
        txt = txt.lower()

    # Application regex définie en base
    if pattern:
        try:
            txt = re.sub(pattern, "", txt)
        except re.error as exc:
            raise ArticleWriteError(f"Regex invalide: {pattern}") from exc

    # Nous ne touchons PAS aux espaces. Aucun collapse. Aucune suppression automatique.

    txt = txt.strip()
    return txt or None


def _extract_regex(pattern_type: str) -> Optional[str]:
    patterns = regex_patterns_service.get_all_regex_patterns(filters={"type": pattern_type}, limit=1)
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

        # ISO direct
        try:
            return date.fromisoformat(raw[:10])
        except Exception:
            pass

        # Formats FR courants
        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%d.%m.%Y"):
            try:
                return datetime.strptime(raw[:10], fmt).date()
            except Exception:
                pass

        return None

    return None


def _unique(sequence: Iterable[UUID]) -> List[UUID]:
    seen: set[UUID] = set()
    ordered: List[UUID] = []
    for item in sequence:
        if item and item not in seen:
            seen.add(item)
            ordered.append(item)
    return ordered


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
    unit: Optional[str] 


# ---------------------------------------------------------------------------
# Core logic
# ---------------------------------------------------------------------------


def create_articles_from_lines(
    *,
    establishment_id: UUID,
    supplier_id: UUID,
    market_supplier_id: UUID,
    invoice_id: UUID,
    invoice_date: Any,
    lines: Sequence[dict],
    invoice_path: Any = None,
) -> Dict[str, Any]:
    invoice_date_parsed = _as_date(invoice_date)
    if not invoice_date_parsed:
        raise ArticleWriteError("Date de facture invalide")

    master_articles_cache: Dict[UUID, Any] = {}
    master_article_by_market_id: Dict[UUID, Any] = {}
    market_master_articles_cache: Dict[str, Any] = {}
    articles_by_master: Dict[UUID, List[ArticleEntry]] = defaultdict(list)
    master_article_ids: List[UUID] = []
    articles_created: List[ArticleEntry] = []
    regex_master_article = _extract_regex("market_master_article_name")

    for line in lines:
        if not isinstance(line, dict):
            continue
        raw_name = line.get("product_name")
        cleaned_name = _apply_regex(regex_master_article, raw_name, "market_master_article_name") or raw_name
        if not cleaned_name:
            raise ArticleWriteError("Nom de produit manquant pour la ligne fournie")

        cached_mma = market_master_articles_cache.get(cleaned_name)
        if cached_mma is not None:
            market_master_article = cached_mma
        else:
            mma = market_master_articles_service.get_all_market_master_articles(
                filters={"market_supplier_id": market_supplier_id, "unformatted_name": cleaned_name},
                limit=1,
            )

            if mma:
                market_master_article = mma[0]
            else:
                market_master_article = market_master_articles_service.create_market_master_articles(
                    {
                        "market_supplier_id": market_supplier_id,
                        "name": raw_name,
                        "unformatted_name": cleaned_name,
                        "unit": line.get("unit"),
                        "current_unit_price": _as_decimal(line.get("unit_price_excl_tax")),
                    }
                )
            market_master_articles_cache[cleaned_name] = market_master_article
        if not market_master_article:
            raise ArticleWriteError("Création du market_master_article impossible")
        market_master_article_id = _safe_get(market_master_article, "id")
        if not market_master_article_id:
            raise ArticleWriteError("Market master article sans identifiant")

        cached_master_article = master_article_by_market_id.get(market_master_article_id)
        if cached_master_article is not None:
            master_article = cached_master_article
        else:
            found_master = master_articles_service.get_all_master_articles(
                filters={"establishment_id": establishment_id, "market_master_article_id": market_master_article_id},
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
                        "name": raw_name,
                    }
                )
            master_article_by_market_id[market_master_article_id] = master_article
        if not master_article:
            raise ArticleWriteError("Création du master_article impossible")
        master_article_id = _safe_get(master_article, "id")
        if not master_article_id:
            raise ArticleWriteError("Master article sans identifiant")
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
                "date": invoice_date_parsed,
                "unit": line.get("unit"),
                "unit_price": unit_price,
                "discounts": discounts,
                "duties_and_taxes": duties,
                "invoice_path": invoice_path,
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
                "date": invoice_date_parsed,
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
            raise ArticleWriteError("Création de l'article impossible")

        entry = ArticleEntry(
            article_id=article_id,
            master_article_id=master_article_id,
            unit_price=unit_price,
            quantity=quantity,
            line_total=line_total,
            discounts=discounts,
            duties=duties,
            date=invoice_date_parsed,
            unit=line.get("unit"),
        )
        articles_by_master[master_article_id].append(entry)
        articles_created.append(entry)

        latest_articles = articles_service.get_all_articles(
            filters={"master_article_id": master_article_id, "order_by": "date", "direction": "desc"},
            limit=1,
        )
        if latest_articles:
            latest_art = latest_articles[0]
            master_articles_service.update_master_articles(
                master_article_id, {"current_unit_price": _safe_get(latest_art, "unit_price")}
            )

        latest_market_articles = market_articles_service.get_all_market_articles(
            filters={"market_master_article_id": market_master_article_id, "order_by": "date", "direction": "desc"},
            limit=1,
        )
        if latest_market_articles:
            latest_mma = latest_market_articles[0]
            market_master_articles_service.update_market_master_articles(
                market_master_article_id, {"current_unit_price": _safe_get(latest_mma, "unit_price")}
            )

    return {
        "master_article_ids": _unique(master_article_ids),
        "articles_by_master": articles_by_master,
        "articles_created": articles_created,
        "master_articles_cache": master_articles_cache,
    }