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
        .select("id, date, supplier_id, total_ht, total_ttc, establishment_id, invoice_number")
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
            "id, name, quantity, unit, unit_price, invoice_id, master_article_id, establishment_id"
        )
        .eq("invoice_id", invoice_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    articles = articles_response.data or []

    # --- 3. Calcul des variations de prix ---
    for article in articles:
        master_article_id = article.get("master_article_id")
        current_price = _to_decimal(article.get("unit_price"))
        current_price = current_price.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)
        previous_article = None

        if master_article_id and invoice_date:
            previous_response = (
                supabase.table("articles")
                .select("unit_price, date")
                .eq("master_article_id", master_article_id)
                .eq("establishment_id", establishment_id)
                .lt("date", str(invoice_date))
                .order("date", desc=True)
                .limit(1)
                .execute()
            )
            previous_data = previous_response.data
            if previous_data:
                previous_article = previous_data[0]

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

    # --- 4. Résultat final ---
    result = {
        "invoice": invoice,
        "articles_count": len(articles),
        "articles": articles,
    }

    return result

    # Indications :
    # - Vérifier que l'ID facture correspond à l'établissement connecté (mapping invoices.establishment_id) et journaliser les appels Supabase.
    # - Sécuriser la conversion de dates ISO et ajouter un contrôle de type sur unit_price pour éviter des variations erronées (prix None ou string).
    # - Prévoir un fallback lorsque l'article précédent n'existe pas ou lorsque la colonne articles.date est absente ; mentionner dans les logs pour affiner le mapping.
    # - Remonter en option le prix moyen/écart-type des articles de la facture et signaler si la colonne establishment_id manque côté articles (cohérence schéma DB).
    # Tests robustes :
    # - Mocker Supabase pour couvrir factures inexistantes, dates invalides et articles sans master_article_id.
    # - Injecter des unit_price à 0, None ou string pour vérifier le calcul variation_euro/% et l'absence de crash.
    # - Vérifier qu'un article lié à un autre établissement est rejeté et que le comptage d'articles reste exact.