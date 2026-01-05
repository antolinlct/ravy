from __future__ import annotations

import io
from pathlib import Path
from datetime import date as dt_date, datetime as dt_datetime
from typing import Iterable, List, Optional

import requests
from fpdf import FPDF, HTMLMixin

from app.schemas.recipes import Recipes


class PDF(FPDF, HTMLMixin):
    """Simple PDF builder with helpers for tables and images."""

    def __init__(self, *args, header_logo_path: Optional[Path] = None, **kwargs):
        super().__init__(*args, **kwargs)
        self._header_logo_path = header_logo_path
        self._header_logo_height = 10

    def header(self):
        if not self._header_logo_path:
            return
        start_y = self.t_margin
        try:
            self.image(str(self._header_logo_path), x=self.l_margin, y=start_y, w=26)
            self.set_y(start_y + self._header_logo_height + 2)
        except Exception:
            self.set_font("Helvetica", "B", 10)
            self.set_xy(self.l_margin, start_y)
            self.cell(0, 6, "Ravy", ln=1)
            self.set_y(start_y + self._header_logo_height + 2)

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "", 9)
        page_label = f"Page {self.page_no()}/{{nb}}"
        self.cell(0, 8, _safe_text(page_label), align="R")


_TEXT_REPLACEMENTS = {
    "\u2022": "-",  # bullet
    "\u2013": "-",  # en dash
    "\u2014": "-",  # em dash
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2026": "...",
    "\u00a0": " ",  # non‑breaking space
    "€": "EUR",
}


def _safe_text(value: Optional[str]) -> str:
    if value is None:
        return ""
    text = str(value)
    for source, target in _TEXT_REPLACEMENTS.items():
        text = text.replace(source, target)
    return text.encode("latin-1", "ignore").decode("latin-1")


def _resolve_logo_path() -> Optional[Path]:
    """
    Locate the ravy logo (prefer PNG, fallback SVG) relative to the project.
    """
    here = Path(__file__).resolve()
    candidates = [
        here.parents[2] / "assets" / "branding" / "logo_dark.png",
        here.parents[2] / "assets" / "branding" / "logo_dark.svg",
        here.parents[4] / "frontend" / "src" / "assets" / "branding" / "logo_dark.png",
        here.parents[4] / "frontend" / "src" / "assets" / "branding" / "logo_dark.svg",
        here.parents[3] / "frontend" / "src" / "assets" / "branding" / "logo_dark.png",
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


def _get_image_dimensions(data: bytes) -> Optional[tuple[int, int]]:
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        width = int.from_bytes(data[16:20], "big")
        height = int.from_bytes(data[20:24], "big")
        if width > 0 and height > 0:
            return width, height
    if data[:2] == b"\xff\xd8":
        i = 2
        while i + 9 < len(data):
            if data[i] != 0xFF:
                i += 1
                continue
            marker = data[i + 1]
            if marker in {
                0xC0,
                0xC1,
                0xC2,
                0xC3,
                0xC5,
                0xC6,
                0xC7,
                0xC9,
                0xCA,
                0xCB,
                0xCD,
                0xCE,
                0xCF,
            }:
                height = int.from_bytes(data[i + 5 : i + 7], "big")
                width = int.from_bytes(data[i + 7 : i + 9], "big")
                if width > 0 and height > 0:
                    return width, height
                return None
            if marker == 0xDA:
                break
            if i + 4 >= len(data):
                break
            segment_length = int.from_bytes(data[i + 2 : i + 4], "big")
            if segment_length <= 0:
                break
            i += 2 + segment_length
    return None


def _add_logo(pdf: PDF, max_height: float = 16) -> None:
    logo_path = _resolve_logo_path()
    if not logo_path:
        return
    try:
        if logo_path.suffix.lower() == ".svg":
            pdf.render_svg(str(logo_path), x=pdf.l_margin, y=pdf.y, w=38, h=max_height)
        else:
            pdf.image(str(logo_path), x=pdf.l_margin, y=pdf.y, w=38, h=0)
        pdf.set_y(pdf.y + max_height + 3)
    except Exception:
        pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Ravy", ln=1)


def _section_title(pdf: PDF, title: str):
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, _safe_text(title), ln=1)
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
        pdf.cell(col_widths[idx], 8, _safe_text(header), border=1, ln=0, align=align, fill=True)
    pdf.ln()
    pdf.set_font("Helvetica", "", 9)
    for row in rows:
        for idx, cell in enumerate(row):
            pdf.cell(col_widths[idx], 7, _safe_text(cell), border=1, ln=0, align=align)
        pdf.ln()
    pdf.ln(2)


def _format_currency(value: Optional[float]) -> str:
    if value is None:
        return "-"
    return _safe_text(f"{value:,.2f} €".replace(",", " ").replace(".", ","))


def _format_percent(value: Optional[float]) -> str:
    if value is None:
        return "-"
    return _safe_text(f"{value*100:.2f} %".replace(".", ","))


def _to_float(value: Optional[object]) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


_MONTHS_FR = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
]


def _format_portions(value: Optional[float]) -> str:
    if value is None or value <= 0:
        value = 1
    if abs(value - round(value)) < 1e-6:
        return str(int(round(value)))
    return f"{value:.1f}".replace(".", ",")


def _format_date_long(value: Optional[dt_datetime | dt_date]) -> str:
    if value is None:
        value = dt_date.today()
    if isinstance(value, dt_datetime):
        value = value.date()
    month = _MONTHS_FR[value.month - 1].capitalize()
    return f"{value.day:02d} {month} {value.year}"


def render_recipe_pdf(
    recipe: Recipes,
    ingredients: List[dict],
    include_financials: bool = True,
    technical_image_url: Optional[str] = None,
    instructions_html: Optional[str] = None,
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
    logo_path = _resolve_logo_path()
    pdf = PDF(format="A4", header_logo_path=logo_path)
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_margins(15, 15, 15)

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, _safe_text(recipe.name or "Fiche technique"), ln=1)
    pdf.set_font("Helvetica", "", 10)
    portion_label = _format_portions(recipe.portion)
    version_date = _format_date_long(recipe.updated_at or recipe.created_at)
    subtitle = f"Fiche technique pour {portion_label} portions - Version du {version_date}"
    pdf.cell(0, 7, _safe_text(subtitle), ln=1)
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    margin_pct: Optional[float] = None
    try:
        if recipe.price_excl_tax and recipe.purchase_cost_per_portion is not None:
            margin_pct = (
                (recipe.price_excl_tax - recipe.purchase_cost_per_portion)
                / recipe.price_excl_tax
            )
    except Exception:
        margin_pct = None

    if include_financials:
        summary = [
            ("Coût d'achat total", _format_currency(recipe.purchase_cost_total)),
            ("Coût par portion", _format_currency(recipe.purchase_cost_per_portion)),
            ("Prix de vente TTC", _format_currency(recipe.price_incl_tax)),
            ("Marge HT", _format_currency(recipe.current_margin)),
            ("Marge % HT", _format_percent(margin_pct)),
        ]
    else:
        summary = [("Prix de vente TTC", _format_currency(recipe.price_incl_tax))]
    highlight_rows = {"Prix de vente TTC", "Marge HT", "Marge % HT"}
    label_width = 60
    value_width = 45
    table_width = label_width + value_width
    table_start_y = pdf.y
    table_start_x = pdf.l_margin
    table_height = 8 + (len(summary) * 7)

    img_bytes = _fetch_image_bytes(technical_image_url or recipe.technical_data_sheet_image_path)
    image_bottom = table_start_y
    if img_bytes:
        try:
            img_stream = io.BytesIO(img_bytes)
            img_stream.name = "tech_image.png"
            image_height = table_height
            image_dims = _get_image_dimensions(img_bytes)
            if image_dims:
                raw_w, raw_h = image_dims
                image_width = image_height * (raw_w / raw_h)
            else:
                image_width = 60
            max_width = pdf.w - pdf.r_margin - table_width - 6
            if image_width > max_width:
                image_width = max_width
                image_height = image_width * (raw_h / raw_w) if image_dims else image_height
            image_x = pdf.w - pdf.r_margin - image_width
            pdf.image(img_stream, x=image_x, y=table_start_y, w=image_width, h=image_height)
            image_bottom = table_start_y + image_height
        except Exception:
            image_bottom = table_start_y

    pdf.set_xy(table_start_x, table_start_y)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(245, 245, 245)
    pdf.set_draw_color(210, 210, 210)
    pdf.cell(table_width, 8, _safe_text("Informations financières"), border=1, ln=1, fill=True)
    for label, value in summary:
        is_highlight = label in highlight_rows
        pdf.set_font("Helvetica", "B" if is_highlight else "", 10)
        pdf.cell(label_width, 7, _safe_text(label), border=1, ln=0)
        pdf.cell(value_width, 7, _safe_text(value), border=1, ln=1)

    pdf.set_y(max(table_start_y + table_height, image_bottom) + 4)

    _section_title(pdf, "Instructions")
    instructions = recipe.technical_data_sheet_instructions or "Aucune instruction fournie."
    html = (instructions_html or "").strip()
    if html:
        try:
            pdf.write_html(html)
        except Exception:
            pdf.multi_cell(0, 6, _safe_text(instructions))
    else:
        pdf.multi_cell(0, 6, _safe_text(instructions))

    pdf.add_page()
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, _safe_text("Liste des ingrédients :"), ln=1)
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
        _section_title(pdf, label)
        if type_label == "ARTICLE":
            if include_financials:
                headers = ["Fournisseur", "Nom", "Quantité", "Perte", "Coût net"]
                col_widths = [40, 60, 25, 20, 35]
            else:
                headers = ["Fournisseur", "Nom", "Quantité", "Perte"]
                col_widths = [45, 70, 30, 25]
        elif type_label == "SUBRECIPE":
            if include_financials:
                headers = ["Nom", "Quantité", "Poids portion", "Coût net"]
                col_widths = [70, 35, 35, 30]
            else:
                headers = ["Nom", "Quantité", "Poids portion"]
                col_widths = [80, 40, 40]
        else:
            if include_financials:
                headers = ["Nom", "Coût net"]
                col_widths = [90, 50]
            else:
                headers = ["Nom"]
                col_widths = [140]
        data_rows: List[List[str]] = []
        for row in rows:
            qty = row.get("quantity")
            unit = row.get("unit") or ""
            if type_label == "FIXED":
                qty_display = str(qty) if qty is not None else "-"
            else:
                qty_display = f"{qty} {unit}".strip() if qty is not None else "-"
            cost = row.get("unit_cost")
            cost_value = _to_float(cost)
            qty_value = _to_float(qty)
            total_cost = (
                cost_value * qty_value
                if cost_value is not None and qty_value is not None
                else None
            )
            if type_label == "ARTICLE":
                supplier = row.get("supplier") or "-"
                loss = row.get("loss_percent")
                loss_display = (
                    "-"
                    if loss is None or abs(float(loss)) < 1e-9
                    else f"{loss:.1f} %".replace(".", ",")
                )
                row_cells = [
                    str(supplier),
                    str(row.get("name") or "-"),
                    qty_display,
                    loss_display,
                ]
                if include_financials:
                    row_cells.append(_format_currency(total_cost))
                data_rows.append(row_cells)
            elif type_label == "SUBRECIPE":
                portion_weight = _to_float(row.get("portion_weight"))
                portion_label = "-" if portion_weight is None else f"{portion_weight:.0f} g"
                row_cells = [
                    str(row.get("name") or "-"),
                    qty_display,
                    portion_label,
                ]
                if include_financials:
                    row_cells.append(_format_currency(total_cost))
                data_rows.append(row_cells)
            else:
                row_cells = [str(row.get("name") or "-")]
                if include_financials:
                    row_cells.append(_format_currency(total_cost))
                data_rows.append(row_cells)
        _table(pdf, headers, data_rows, col_widths=col_widths)

    output = pdf.output(dest="S")
    if isinstance(output, (bytes, bytearray)):
        return bytes(output)
    return str(output).encode("latin1")
