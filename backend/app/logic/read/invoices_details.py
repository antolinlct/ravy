from typing import Dict, Any, List
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from app.core.supabase_client import supabase


def _to_decimal(value: Any, default: str = "0") -> Decimal:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal(default)


def get_invoice_detail(invoice_id: str) -> Dict[str, Any]:
    """
    Retourne les informations complètes d'une facture :
    - Données de la facture (table public.invoices)
    - Liste des articles associés (table public.articles)
    - Nombre total d'articles
    - Variation du prix unitaire (€/%) pour chaque article,
      comparée à la facture précédente pour le même master_article_id
    """

    # --- 1. Récupération de la facture ---
    invoice_response = (
        supabase.table("invoices")
        .select(
            "id, date, supplier_id, total_excl_tax, total_tax, total_incl_tax, "
            "establishment_id, invoice_number"
        )
        .eq("id", invoice_id)
        .execute()
    )

    if not invoice_response.data:
        return {"error": "Invoice not found", "invoice_id": invoice_id}

    invoice = invoice_response.data[0]
    establishment_id = invoice.get("establishment_id")
    invoice_date = None

    if invoice.get("date"):
        try:
            invoice_date = date.fromisoformat(invoice["date"])
        except Exception:
            invoice_date = None

    # --- 2. Récupération des articles liés ---
    articles_response = (
        supabase.table("articles")
        .select(
            "id, quantity, unit, unit_price, total, discounts, duties_and_taxes, "
            "gross_unit_price, invoice_id, master_article_id, establishment_id"
        )
        .eq("invoice_id", invoice_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    articles = articles_response.data or []

    # --- 3. Préchargement des derniers prix par master_article_id ---
    previous_by_master: Dict[str, Any] = {}
    if invoice_date and establishment_id:
        master_ids = {
            article.get("master_article_id")
            for article in articles
            if article.get("master_article_id")
        }
        if master_ids:
            previous_response = (
                supabase.table("articles")
                .select("master_article_id, unit_price, date")
                .eq("establishment_id", establishment_id)
                .in_("master_article_id", list(master_ids))
                .lt("date", str(invoice_date))
                .order("date", desc=True)
                .execute()
            )
            for row in previous_response.data or []:
                master_id = row.get("master_article_id")
                if master_id and master_id not in previous_by_master:
                    previous_by_master[master_id] = row

    # --- 4. Calcul des variations de prix ---
    for article in articles:
        master_article_id = article.get("master_article_id")
        current_price = _to_decimal(article.get("unit_price"))
        current_price = current_price.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
        previous_article = previous_by_master.get(master_article_id) if master_article_id else None

        if previous_article:
            previous_price = _to_decimal(previous_article.get("unit_price", 0))
            previous_price = previous_price.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
            variation_euro = (current_price - previous_price).quantize(
                Decimal("0.001"), rounding=ROUND_HALF_UP
            )
            variation_percent = (
                (
                    (current_price - previous_price)
                    / previous_price
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                if previous_price != 0
                else Decimal("0")
            )
        else:
            previous_price = None
            variation_euro = Decimal("0")
            variation_percent = Decimal("0")

        article["previous_unit_price"] = previous_price
        article["variation_euro"] = float(variation_euro)
        article["variation_percent"] = float(variation_percent)

    # --- 5. Résultat final ---
    result = {
        "invoice": invoice,
        "articles_count": len(articles),
        "articles": articles,
    }

    return result
