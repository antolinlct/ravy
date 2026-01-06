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

from fastapi.encoders import jsonable_encoder
from postgrest.exceptions import APIError

from app.core.supabase_client import supabase
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


def _chunked(sequence: Sequence[str], size: int = 200) -> Iterable[List[str]]:
    if size <= 0:
        raise ValueError("Chunk size must be positive")
    for index in range(0, len(sequence), size):
        yield list(sequence[index : index + size])


def _is_duplicate_error(exc: APIError) -> bool:
    payload = exc.args[0] if exc.args else None
    if isinstance(payload, dict):
        return payload.get("code") == "23505"
    return "duplicate key value" in str(exc)


@dataclass
class ArticleEntry:
    article_id: Optional[UUID]
    master_article_id: UUID
    unit_price: Optional[Decimal]
    gross_unit_price: Optional[Decimal]
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
    master_article_by_market_id: Dict[str, Any] = {}
    market_master_articles_cache: Dict[str, Any] = {}
    articles_by_master: Dict[UUID, List[ArticleEntry]] = defaultdict(list)
    master_article_ids: List[UUID] = []
    market_master_article_ids: List[UUID] = []
    articles_created: List[ArticleEntry] = []
    article_payloads: List[Dict[str, Any]] = []
    article_meta: List[Dict[str, Any]] = []
    market_aggregates: Dict[Any, Dict[str, Any]] = {}
    regex_master_article = _extract_regex("market_master_article_name")

    line_items: List[Dict[str, Any]] = []
    first_line_by_cleaned: Dict[str, dict] = {}
    cleaned_names_order: List[str] = []

    for line in lines:
        if not isinstance(line, dict):
            continue
        raw_name = line.get("product_name")
        cleaned_name = _apply_regex(regex_master_article, raw_name, "market_master_article_name") or raw_name
        if not cleaned_name:
            raise ArticleWriteError("Nom de produit manquant pour la ligne fournie")
        line_items.append({"line": line, "raw_name": raw_name, "cleaned_name": cleaned_name})
        if cleaned_name not in first_line_by_cleaned:
            first_line_by_cleaned[cleaned_name] = line
            cleaned_names_order.append(cleaned_name)

    if cleaned_names_order:
        for chunk in _chunked(cleaned_names_order):
            response = (
                supabase.schema("market")
                .table("market_master_articles")
                .select("id, unformatted_name, name, unit, current_unit_price")
                .eq("market_supplier_id", market_supplier_id)
                .in_("unformatted_name", chunk)
                .execute()
            )
            for row in response.data or []:
                key = row.get("unformatted_name")
                if key:
                    market_master_articles_cache[key] = row

    missing_cleaned = [name for name in cleaned_names_order if name not in market_master_articles_cache]
    if missing_cleaned:
        payloads = []
        for name in missing_cleaned:
            line = first_line_by_cleaned.get(name) or {}
            payloads.append(
                {
                    "market_supplier_id": market_supplier_id,
                    "name": line.get("product_name"),
                    "unformatted_name": name,
                    "unit": line.get("unit"),
                    "current_unit_price": _as_decimal(line.get("unit_price_excl_tax")),
                }
            )
        if payloads:
            prepared = jsonable_encoder([{k: v for k, v in p.items() if v is not None} for p in payloads])
            try:
                response = (
                    supabase.schema("market")
                    .table("market_master_articles")
                    .insert(prepared)
                    .execute()
                )
                for row in response.data or []:
                    key = row.get("unformatted_name")
                    if key:
                        market_master_articles_cache[key] = row
            except Exception:
                pass

        remaining = [name for name in missing_cleaned if name not in market_master_articles_cache]
        if remaining:
            for chunk in _chunked(remaining):
                response = (
                    supabase.schema("market")
                    .table("market_master_articles")
                    .select("id, unformatted_name, name, unit, current_unit_price")
                    .eq("market_supplier_id", market_supplier_id)
                    .in_("unformatted_name", chunk)
                    .execute()
                )
                for row in response.data or []:
                    key = row.get("unformatted_name")
                    if key:
                        market_master_articles_cache[key] = row

    market_master_by_id = {
        str(_safe_get(row, "id")): row
        for row in market_master_articles_cache.values()
        if _safe_get(row, "id")
    }
    first_line_by_market_id: Dict[str, dict] = {}
    for cleaned_name, line in first_line_by_cleaned.items():
        mma = market_master_articles_cache.get(cleaned_name)
        mma_id = _safe_get(mma, "id")
        if mma_id:
            first_line_by_market_id[str(mma_id)] = line

    market_master_ids = list(market_master_by_id.keys())
    if market_master_ids:
        for chunk in _chunked(market_master_ids):
            response = (
                supabase.table("master_articles")
                .select("id, market_master_article_id")
                .eq("establishment_id", str(establishment_id))
                .in_("market_master_article_id", chunk)
                .execute()
            )
            for row in response.data or []:
                key = str(row.get("market_master_article_id"))
                if key:
                    master_article_by_market_id[key] = row

    missing_master_ids = [market_id for market_id in market_master_ids if market_id not in master_article_by_market_id]
    if missing_master_ids:
        payloads = []
        for market_id in missing_master_ids:
            line = first_line_by_market_id.get(market_id) or {}
            mma = market_master_by_id.get(market_id, {})
            payloads.append(
                {
                    "establishment_id": establishment_id,
                    "supplier_id": supplier_id,
                    "market_master_article_id": market_id,
                    "unit": line.get("unit") or _safe_get(mma, "unit"),
                    "unformatted_name": _safe_get(mma, "unformatted_name"),
                    "current_unit_price": _as_decimal(line.get("unit_price_excl_tax")),
                    "name": line.get("product_name") or _safe_get(mma, "name"),
                }
            )
        if payloads:
            prepared = jsonable_encoder([{k: v for k, v in p.items() if v is not None} for p in payloads])
            try:
                response = supabase.table("master_articles").insert(prepared).execute()
                for row in response.data or []:
                    key = str(row.get("market_master_article_id"))
                    if key:
                        master_article_by_market_id[key] = row
            except Exception:
                pass

        remaining = [market_id for market_id in missing_master_ids if market_id not in master_article_by_market_id]
        if remaining:
            for chunk in _chunked(remaining):
                response = (
                    supabase.table("master_articles")
                    .select("id, market_master_article_id")
                    .eq("establishment_id", str(establishment_id))
                    .in_("market_master_article_id", chunk)
                    .execute()
                )
                for row in response.data or []:
                    key = str(row.get("market_master_article_id"))
                    if key:
                        master_article_by_market_id[key] = row

    for item in line_items:
        line = item["line"]
        raw_name = item["raw_name"]
        cleaned_name = item["cleaned_name"]

        market_master_article = market_master_articles_cache.get(cleaned_name)
        if not market_master_article:
            raise ArticleWriteError("Création du market_master_article impossible")
        market_master_article_id = _safe_get(market_master_article, "id")
        if not market_master_article_id:
            raise ArticleWriteError("Market master article sans identifiant")
        market_master_article_ids.append(market_master_article_id)

        master_article = master_article_by_market_id.get(str(market_master_article_id))
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
        gross_unit_price = _as_decimal(line.get("gross_unit-price"))

        aggregate = market_aggregates.get(market_master_article_id)
        if aggregate is None:
            aggregate = {
                "market_master_article_id": market_master_article_id,
                "market_supplier_id": market_supplier_id,
                "establishment_id": establishment_id,
                "date": invoice_date_parsed,
                "invoice_id": invoice_id,
                "_lines": [],
            }
            market_aggregates[market_master_article_id] = aggregate

        aggregate["_lines"].append(
            {
                "unit_price": unit_price,
                "quantity": quantity,
                "discounts": discounts,
                "duties_and_taxes": duties,
                "invoice_path": invoice_path,
                "gross_unit_price": gross_unit_price,
                "unit": line.get("unit"),
            }
        )

        article_payloads.append(
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
                "gross_unit_price": gross_unit_price,
            }
        )
        article_meta.append(
            {
                "master_article_id": master_article_id,
                "unit_price": unit_price,
                "quantity": quantity,
                "line_total": line_total,
                "discounts": discounts,
                "duties": duties,
                "date": invoice_date_parsed,
                "unit": line.get("unit"),
                "gross_unit_price": gross_unit_price,
            }
        )

    if market_aggregates:
        market_master_ids = [str(item) for item in market_aggregates.keys()]
        existing_rows: Dict[str, Any] = {}
        if market_master_ids:
            for chunk in _chunked(market_master_ids):
                response = (
                    supabase.schema("market")
                    .table("market_articles")
                    .select(
                        "id, market_master_article_id, unit_price, quantity, invoice_id, market_supplier_id, establishment_id, date"
                    )
                    .eq("date", invoice_date_parsed.isoformat())
                    .in_("market_master_article_id", chunk)
                    .execute()
                )
                for row in response.data or []:
                    existing_rows[str(row.get("market_master_article_id"))] = row

        market_payloads_to_insert: List[Dict[str, Any]] = []
        for market_master_article_id, aggregate in market_aggregates.items():
            lines = aggregate.pop("_lines", [])
            if not lines:
                continue

            last_line = lines[-1]
            current_unit_price = None
            current_quantity = None

            existing_row = existing_rows.get(str(market_master_article_id))
            if existing_row:
                current_unit_price = _as_decimal(_safe_get(existing_row, "unit_price"))
                current_quantity = _as_decimal(_safe_get(existing_row, "quantity"))

            for line_item in lines:
                line_unit_price = line_item.get("unit_price")
                line_quantity = line_item.get("quantity")

                new_unit_price = line_unit_price or current_unit_price
                new_quantity = line_quantity or current_quantity

                if (
                    line_unit_price is not None
                    and line_quantity is not None
                    and current_unit_price is not None
                    and current_quantity is not None
                    and (current_quantity + line_quantity) != 0
                ):
                    total_qty = current_quantity + line_quantity
                    new_unit_price = (
                        current_unit_price * current_quantity + line_unit_price * line_quantity
                    ) / total_qty
                    new_quantity = total_qty

                current_unit_price = new_unit_price
                current_quantity = new_quantity

            aggregate["unit_price"] = current_unit_price
            aggregate["quantity"] = current_quantity
            aggregate["discounts"] = last_line.get("discounts")
            aggregate["duties_and_taxes"] = last_line.get("duties_and_taxes")
            aggregate["invoice_path"] = last_line.get("invoice_path")
            aggregate["gross_unit_price"] = last_line.get("gross_unit_price")
            aggregate["unit"] = last_line.get("unit")

            if existing_row:
                aggregate["invoice_id"] = _safe_get(existing_row, "invoice_id") or aggregate.get("invoice_id")
                aggregate["market_supplier_id"] = _safe_get(existing_row, "market_supplier_id") or aggregate.get(
                    "market_supplier_id"
                )
                aggregate["establishment_id"] = _safe_get(existing_row, "establishment_id") or aggregate.get(
                    "establishment_id"
                )

            market_payloads_to_insert.append(aggregate)

        if market_payloads_to_insert:
            prepared_market = jsonable_encoder(
                [
                    {k: v for k, v in payload.items() if v is not None and k != "id"}
                    for payload in market_payloads_to_insert
                ]
            )
            supabase.schema("market").table("market_articles").upsert(
                prepared_market, on_conflict="market_master_article_id,date"
            ).execute()

    if article_payloads:
        try:
            prepared_articles = jsonable_encoder(
                [
                    {k: v for k, v in payload.items() if v is not None and k != "id"}
                    for payload in article_payloads
                ]
            )
            response = supabase.table("articles").insert(prepared_articles).execute()
            created_rows = response.data or []
            if len(created_rows) != len(article_meta):
                raise ArticleWriteError("Création de l'article impossible")
        except Exception as exc:
            created_rows = []
            for payload, meta in zip(article_payloads, article_meta):
                article = articles_service.create_articles(payload)
                article_id = _safe_get(article, "id")
                if not article or not article_id:
                    raise ArticleWriteError("Création de l'article impossible") from exc
                created_rows.append(article)

        for meta, article in zip(article_meta, created_rows):
            article_id = _safe_get(article, "id")
            if not article_id:
                raise ArticleWriteError("Création de l'article impossible")

            entry = ArticleEntry(
                article_id=article_id,
                master_article_id=meta["master_article_id"],
                unit_price=meta["unit_price"],
                quantity=meta["quantity"],
                line_total=meta["line_total"],
                discounts=meta["discounts"],
                duties=meta["duties"],
                date=meta["date"],
                unit=meta["unit"],
                gross_unit_price=meta["gross_unit_price"],
            )
            articles_by_master[meta["master_article_id"]].append(entry)
            articles_created.append(entry)

    master_updates: Dict[str, Optional[Decimal]] = {}
    master_ids = [str(item) for item in _unique(master_article_ids)]
    if master_ids:
        for chunk in _chunked(master_ids):
            response = (
                supabase.table("articles")
                .select("master_article_id, unit_price, date")
                .in_("master_article_id", chunk)
                .order("date", desc=True)
                .execute()
            )
            for row in response.data or []:
                master_id = row.get("master_article_id")
                if not master_id:
                    continue
                key = str(master_id)
                if key in master_updates:
                    continue
                master_updates[key] = _as_decimal(_safe_get(row, "unit_price"))

    if master_updates:
        for master_id, price in master_updates.items():
            if price is None:
                continue
            master_articles_service.update_master_articles(UUID(master_id), {"current_unit_price": price})

    market_updates: Dict[str, Optional[Decimal]] = {}
    market_ids = [str(item) for item in _unique(market_master_article_ids)]
    if market_ids:
        for chunk in _chunked(market_ids):
            response = (
                supabase.schema("market")
                .table("market_articles")
                .select("market_master_article_id, unit_price, date")
                .in_("market_master_article_id", chunk)
                .order("date", desc=True)
                .execute()
            )
            for row in response.data or []:
                market_id = row.get("market_master_article_id")
                if not market_id:
                    continue
                key = str(market_id)
                if key in market_updates:
                    continue
                market_updates[key] = _as_decimal(_safe_get(row, "unit_price"))

    if market_updates:
        for market_id, price in market_updates.items():
            if price is None:
                continue
            market_master_articles_service.update_market_master_articles(UUID(market_id), {"current_unit_price": price})

    return {
        "master_article_ids": _unique(master_article_ids),
        "articles_by_master": articles_by_master,
        "articles_created": articles_created,
        "master_articles_cache": master_articles_cache,
    }
