from __future__ import annotations

import io
from pathlib import Path
from typing import Iterable, List, Optional

import requests
from fpdf import FPDF
from fpdf.svg import SVGMixin

from app.schemas.recipes import Recipes


class PDF(FPDF, SVGMixin):
    """Simple PDF builder with helpers for tables and images."""


def _resolve_logo_path() -> Optional[Path]:
    """
    Locate the ravy logo (SVG) relative to the project.
    """
    here = Path(__file__).resolve()
    candidates = [
        here.parents[4] / "frontend" / "src" / "assets" / "branding" / "logo_dark.svg",
        here.parents[3] / "frontend" / "src" / "assets" / "branding" / "logo_dark.svg",
    ]
    for path in candidates:
        if path.exists():
            return path
    return None


def _fetch_image_bytes(path_or_url: Optional[str]) -> Optional[bytes]:
    if not path_or_url:
        return None
    try:
        if path_or_url.startswith(("http://", "https://")):
            resp = requests.get(path_or_url, timeout=10)
            if resp.ok:
                return resp.content
            return None
        file_path = Path(path_or_url)
        if file_path.exists():
            return file_path.read_bytes()
    except Exception:
        return None
    return None


def _add_logo(pdf: PDF, max_height: float = 18) -> None:
    logo_path = _resolve_logo_path()
    if not logo_path:
        return
    try:
        pdf.render_svg(str(logo_path), x=pdf.l_margin, y=pdf.y, w=40, h=max_height)
        pdf.set_y(pdf.y + max_height + 2)
    except Exception:
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Ravy", ln=1)


def _section_title(pdf: PDF, title: str):
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, title, ln=1)
    pdf.set_draw_color(210, 210, 210)
    pdf.set_line_width(0.3)
    pdf.line(pdf.l_margin, pdf.y, pdf.w - pdf.r_margin, pdf.y)
    pdf.ln(3)


def _table(
    pdf: PDF,
    headers: List[str],
    rows: Iterable[List[str]],
    col_widths: Optional[List[float]] = None,
    align: str = "L",
    header_fill=(245, 245, 245),
):
    pdf.set_font("Helvetica", "B", 9)
    if col_widths is None:
        col_widths = [((pdf.w - pdf.l_margin - pdf.r_margin) / len(headers))] * len(headers)
    pdf.set_fill_color(*header_fill)
    for idx, header in enumerate(headers):
        pdf.cell(col_widths[idx], 8, header, border=1, ln=0, align=align, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 9)
    for row in rows:
        for idx, cell in enumerate(row):
            pdf.cell(col_widths[idx], 7, cell, border=1, ln=0, align=align)
        pdf.ln()
    pdf.ln(2)


def _format_currency(value: Optional[float]) -> str:
    if value is None:
        return "-"
    return f"{value:,.2f} €".replace(",", " ").replace(".", ",")


def _format_percent(value: Optional[float]) -> str:
    if value is None:
        return "-"
    return f"{value*100:.2f} %".replace(".", ",")


def render_recipe_pdf(
    recipe: Recipes,
    ingredients: List[dict],
    include_financials: bool = True,
    technical_image_url: Optional[str] = None,
) -> bytes:
    """
    Build a PDF for a recipe.

    Args:
        recipe: Recipes model instance with pricing and instructions fields.
        ingredients: list of dicts with at least: name, type, quantity, unit, unit_cost, supplier? product?
        include_financials: whether to show costs/margins details.
        technical_image_url: optional image URL/path for the fiche technique.

    Returns:
        PDF bytes.
    """
    pdf = PDF(format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_margins(15, 15, 15)

    _add_logo(pdf)

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, recipe.name or "Fiche technique", ln=1)
    pdf.set_font("Helvetica", "", 10)
    status = "Active" if recipe.active else "Inactive"
    saleable = "Vendable" if recipe.saleable else "Non vendable"
    pdf.cell(0, 7, f"{status} • {saleable}", ln=1)
    pdf.ln(2)

    img_bytes = _fetch_image_bytes(technical_image_url or recipe.technical_data_sheet_image_path)
    if img_bytes:
        try:
            img_stream = io.BytesIO(img_bytes)
            img_stream.name = "tech_image.png"
            pdf.image(img_stream, w=60, h=45)
            pdf.ln(5)
        except Exception:
            pdf.ln(2)

    grouped = {"ARTICLE": [], "SUBRECIPE": [], "FIXED": []}
    for ing in ingredients:
        grouped.setdefault(ing.get("type") or "AUTRE", []).append(ing)

    for type_label, rows in grouped.items():
        if not rows:
            continue
        label = (
            "Produits"
            if type_label == "ARTICLE"
            else "Sous-recettes"
            if type_label == "SUBRECIPE"
            else "Charges fixes"
        )
        _section_title(pdf, f"Ingrédients – {label}")
        headers = ["Nom", "Quantité", "Coût unitaire"]
        data_rows: List[List[str]] = []
        for row in rows:
            qty = row.get("quantity")
            unit = row.get("unit") or ""
            qty_display = f"{qty} {unit}".strip() if qty is not None else "-"
            cost = row.get("unit_cost")
            data_rows.append(
                [
                    str(row.get("name") or "-"),
                    qty_display,
                    _format_currency(cost) if include_financials else "-",
                ]
            )
        _table(pdf, headers, data_rows, col_widths=[80, 40, 50])

    pdf.set_font("Helvetica", "", 10)
    margin_pct: Optional[float] = None
    try:
        if recipe.price_excl_tax and recipe.purchase_cost_total:
            margin_pct = (recipe.price_excl_tax - recipe.purchase_cost_total) / recipe.price_excl_tax
    except Exception:
        margin_pct = None

    _section_title(pdf, "Informations financières")
    if include_financials:
        summary = [
            ("Coût d'achat total", _format_currency(recipe.purchase_cost_total)),
            ("Coût par portion", _format_currency(recipe.purchase_cost_per_portion)),
            ("Prix de vente TTC", _format_currency(recipe.price_incl_tax)),
            ("Marge HT", _format_currency(recipe.current_margin)),
            ("Marge %", _format_percent(margin_pct)),
        ]
    else:
        summary = [("Prix de vente TTC", _format_currency(recipe.price_incl_tax))]
    for label, value in summary:
        pdf.cell(80, 7, f"{label} :", ln=0)
        pdf.cell(0, 7, value, ln=1)
    pdf.ln(2)

    _section_title(pdf, "Instructions")
    instructions = recipe.technical_data_sheet_instructions or "Aucune instruction fournie."
    pdf.multi_cell(0, 6, instructions)

    return pdf.output(dest="S").encode("latin1")
