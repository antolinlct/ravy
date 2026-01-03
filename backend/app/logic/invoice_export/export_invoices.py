from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from io import BytesIO
import re
import zipfile
from typing import Iterable, Sequence

from openpyxl import Workbook

from app.core.supabase_client import supabase


class ExportError(Exception):
    pass


@dataclass
class InvoiceExportRow:
    invoice_id: str
    supplier_name: str
    invoice_number: str
    date_label: str
    ht: str
    tva: str
    ttc: str
    file_name: str
    storage_path: str | None


def _parse_date(value) -> date | None:
    if not value:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def _format_date(value: date | None, separator: str = "-") -> str:
    if not value:
        return "--"
    return f"{value.day:02d}{separator}{value.month:02d}{separator}{value.year}"


def _safe_filename(value: str) -> str:
    cleaned = re.sub(r"[^\w().-]+", "-", value, flags=re.UNICODE)
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned or "facture"


def _normalize_storage_path(path: str | None) -> str | None:
    if not path:
        return None
    trimmed = path.lstrip("/")
    return trimmed.removeprefix("invoices/")


def _format_currency(value) -> str:
    if value is None:
        return "--"
    try:
        return f"{float(value):.2f} €".replace(".", ",")
    except (TypeError, ValueError):
        return "--"


def _fetch_suppliers(ids: Sequence[str]) -> dict[str, str]:
    if not ids:
        return {}
    response = (
        supabase.table("suppliers")
        .select("id, name")
        .in_("id", list(ids))
        .execute()
    )
    data = response.data or []
    return {item["id"]: item.get("name") or "Fournisseur" for item in data if item.get("id")}


def _build_rows(invoices: Iterable[dict]) -> list[InvoiceExportRow]:
    supplier_ids = {inv.get("supplier_id") for inv in invoices if inv.get("supplier_id")}
    supplier_map = _fetch_suppliers(list(supplier_ids))
    rows: list[InvoiceExportRow] = []
    for inv in invoices:
        invoice_id = str(inv.get("id"))
        supplier_id = inv.get("supplier_id")
        supplier_name = supplier_map.get(supplier_id, "Fournisseur")
        invoice_number = inv.get("invoice_number") or invoice_id[:6]
        invoice_date = _parse_date(inv.get("date") or inv.get("created_at"))
        date_label = _format_date(invoice_date, "-")
        file_name = _safe_filename(f"{supplier_name}-{invoice_number}({date_label})") + ".pdf"
        totals_ht = inv.get("total_excl_tax") or inv.get("total_ht")
        totals_tva = inv.get("total_tax") or inv.get("total_tva")
        totals_ttc = inv.get("total_incl_tax") or inv.get("total_ttc")
        rows.append(
            InvoiceExportRow(
                invoice_id=invoice_id,
                supplier_name=supplier_name,
                invoice_number=str(invoice_number),
                date_label=_format_date(invoice_date, "/"),
                ht=_format_currency(totals_ht),
                tva=_format_currency(totals_tva),
                ttc=_format_currency(totals_ttc),
                file_name=file_name,
                storage_path=_normalize_storage_path(inv.get("file_storage_path")),
            )
        )
    return rows


def _build_xlsx(rows: list[InvoiceExportRow], filename: str) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Factures"
    sheet.append(["Date", "Fournisseur", "Numéro", "HT", "TVA", "TTC", "Fichier"])
    for row in rows:
        sheet.append(
            [
                row.date_label,
                row.supplier_name,
                row.invoice_number,
                row.ht,
                row.tva,
                row.ttc,
                row.file_name,
            ]
        )
    output = BytesIO()
    workbook.save(output)
    output.seek(0)
    return output.read()


def _download_pdf(storage_path: str) -> bytes | None:
    try:
        response = supabase.storage.from_("invoices").download(storage_path)
    except Exception:
        return None
    if isinstance(response, (bytes, bytearray)):
        return bytes(response)
    return None


def export_invoices(establishment_id: str, invoice_ids: Sequence[str]) -> tuple[str, bytes, list[str]]:
    if not invoice_ids:
        raise ExportError("Aucune facture sélectionnée.")

    response = (
        supabase.table("invoices")
        .select("*")
        .eq("establishment_id", establishment_id)
        .in_("id", list(invoice_ids))
        .execute()
    )
    invoices = response.data or []
    if not invoices:
        raise ExportError("Aucune facture trouvée pour cet export.")

    rows = _build_rows(invoices)
    export_date = date.today()
    export_name = f"ravy-export({_format_date(export_date, '-')})"

    xlsx_bytes = _build_xlsx(rows, export_name)

    missing: list[str] = []
    zip_buffer = BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr(f"{export_name}.xlsx", xlsx_bytes)
        for row in rows:
            if not row.storage_path:
                missing.append(row.file_name)
                continue
            pdf_bytes = _download_pdf(row.storage_path)
            if not pdf_bytes:
                missing.append(row.file_name)
                continue
            zip_file.writestr(f"factures/{row.file_name}", pdf_bytes)
        if missing:
            zip_file.writestr(
                "factures-manquantes.txt",
                "\n".join(missing),
            )

    zip_buffer.seek(0)
    return export_name, zip_buffer.read(), missing
