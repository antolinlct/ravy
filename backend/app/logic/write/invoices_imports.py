"""
LOGIC — import_invoice
----------------------

Cette fonction gère l’import d’une facture OCRisée depuis n8n,
et met à jour toutes les entités liées dans la base de données :
- suppliers, invoices, articles, master_articles
- ingredients + history_ingredients
- recipes + history_recipes + sous-recettes
- marges (globale / catégorie / sous-catégorie)
- variations de prix

Aucune file d’attente, aucun log.
Tout est traité séquentiellement, en one-shot.
"""

from datetime import datetime
from typing import Any
import unicodedata
import re
from app.core.supabase_client import supabase


# ---------------------------------------------------------------------
# --------------------------- UTILITAIRES -----------------------------
# ---------------------------------------------------------------------

def normalize_text(text: str) -> str:
    """Nettoie un texte OCRisé : minuscules, sans accents, ponctuation, ni espaces."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("utf-8")  # enlève accents
    text = re.sub(r"[^\w\s]", "", text)  # garde lettres/chiffres/espace
    text = text.lower()
    text = re.sub(r"\s+", "", text)  # supprime TOUS les espaces
    return text.strip()


def clean_with_custom_regex(text: str, patterns: list[str]) -> str:
    """Applique des regex personnalisées pour retirer certains termes parasites."""
    for p in patterns:
        text = re.sub(p, "", text, flags=re.IGNORECASE)
    return text


def safe_float(v: Any) -> float | None:
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------------
# ------------------------ FONCTION PRINCIPALE ------------------------
# ---------------------------------------------------------------------

def import_invoice(payload: dict, custom_supplier_regex: list[str] | None = None,
                   custom_article_regex: list[str] | None = None) -> dict:
    """
    Fonction d’import d’une facture OCRisée (one-shot).
    Paramètres :
        - payload : dict complet reçu depuis n8n
        - custom_supplier_regex : liste regex d’exclusion pour le nom du fournisseur
        - custom_article_regex : liste regex d’exclusion pour le nom des articles
    """

    # ------------------------------------------------------------
    # ETAPE 0 — VALIDATION & EXTRACTION
    # ------------------------------------------------------------
    establishment_id = payload.get("establishment_id")
    supplier_data = payload.get("supplier", {})
    invoice_data = payload.get("invoice", {})
    items = payload.get("items", [])
    file_path = payload.get("file_path")

    if not establishment_id or not invoice_data.get("invoice_date") or not items:
        return {"status": "error", "message": "missing mandatory fields"}

    invoice_date = datetime.fromisoformat(invoice_data["invoice_date"])

    total_ht = safe_float(invoice_data.get("total_ht"))
    total_tva = safe_float(invoice_data.get("total_tva"))
    total_ttc = safe_float(invoice_data.get("total_ttc"))

    # Compléter les montants si possible
    if total_ht is not None and total_tva is not None and total_ttc is None:
        total_ttc = total_ht + total_tva
    elif total_ttc is not None and total_tva is not None and total_ht is None:
        total_ht = total_ttc - total_tva
    elif total_ht is not None and total_ttc is not None and total_tva is None:
        total_tva = total_ttc - total_ht

    # ------------------------------------------------------------
    # ETAPE 1 — SUPPLIER
    # ------------------------------------------------------------
    supplier_name_raw = supplier_data.get("name", "")
    supplier_name_clean = clean_with_custom_regex(supplier_name_raw, custom_supplier_regex or [])
    supplier_name_key = normalize_text(supplier_name_clean)

    # Recherche fournisseur existant (clé OCR-safe)
    existing_suppliers = supabase.table("suppliers").select("*") \
        .eq("establishment_id", establishment_id).execute().data or []
    supplier = next((s for s in existing_suppliers
                     if normalize_text(s.get("name_raw", "")) == supplier_name_key), None)

    if supplier:
        supplier_id = supplier["id"]
    else:
        supplier_payload = {
            "establishment_id": establishment_id,
            "name_raw": supplier_name_raw or None,
            "address": supplier_data.get("address"),
            "siret": supplier_data.get("siret"),
        }
        supplier = supabase.table("suppliers").insert(supplier_payload).execute().data[0]
        supplier_id = supplier["id"]

        # Crée un market_supplier inactif
        supabase.table("market_suppliers").insert({
            "name_raw": supplier_name_raw,
            "active": False
        }).execute()

    # Création facture
    invoice_payload = {
        "supplier_id": supplier_id,
        "establishment_id": establishment_id,
        "invoice_date": invoice_date.isoformat(),
        "total_ht": total_ht,
        "total_ttc": total_ttc,
        "total_tva": total_tva,
        "file_path": file_path
    }
    invoice = supabase.table("invoices").insert(invoice_payload).execute().data[0]
    invoice_id = invoice["id"]

    # ------------------------------------------------------------
    # ETAPE 2 — ARTICLES & MASTER_ARTICLES
    # ------------------------------------------------------------
    master_articles_created = 0
    articles_created = 0
    master_article_ids = set()

    for item in items:
        name_raw = item.get("name_raw", "")
        qty = safe_float(item.get("qty")) or 0
        unit_price_ht = safe_float(item.get("unit_price_ht"))
        line_total_ht = safe_float(item.get("line_total_ht"))
        if not unit_price_ht and line_total_ht and qty > 0:
            unit_price_ht = line_total_ht / qty

        # Nettoyage
        name_clean = clean_with_custom_regex(name_raw, custom_article_regex or [])
        unformatted_name = normalize_text(name_clean)

        # Vérif master_article existant
        existing_master = supabase.table("master_articles").select("*") \
            .eq("supplier_id", supplier_id) \
            .eq("unformatted_name", unformatted_name).execute().data

        if existing_master:
            master_article_id = existing_master[0]["id"]
        else:
            master_payload = {
                "supplier_id": supplier_id,
                "establishment_id": establishment_id,
                "name_raw": name_raw,
                "unformatted_name": unformatted_name
            }
            new_master = supabase.table("master_articles").insert(master_payload).execute().data[0]
            master_article_id = new_master["id"]
            master_articles_created += 1

        master_article_ids.add(master_article_id)

        # Création article
        article_payload = {
            "invoice_id": invoice_id,
            "supplier_id": supplier_id,
            "master_article_id": master_article_id,
            "establishment_id": establishment_id,
            "name_raw": name_raw,
            "unformatted_name": unformatted_name,
            "qty": qty,
            "unit_price_ht": unit_price_ht,
        }
        supabase.table("articles").insert(article_payload).execute()
        articles_created += 1

    # ------------------------------------------------------------
    # ETAPE 3 — INGREDIENTS TYPE ARTICLE
    # ------------------------------------------------------------
    ingredients_histories_created = 0

    ingredients = supabase.table("ingredients").select("*") \
        .eq("establishment_id", establishment_id) \
        .eq("type", "ARTICLE").in_("master_article_id", list(master_article_ids)).execute().data

    for ing in ingredients:
        ing_id = ing["id"]

        # Crée toujours un history_ingredient à la date de facture
        history_payload = {
            "ingredient_id": ing_id,
            "date": invoice_date.isoformat(),
            "gross_unit_price": unit_price_ht or None
        }
        supabase.table("history_ingredients").insert(history_payload).execute()
        ingredients_histories_created += 1

        # Met à jour l’ingredient courant si c’est le plus récent
        recent = supabase.table("history_ingredients").select("*").eq("ingredient_id", ing_id) \
            .order("date", desc=True).limit(1).execute().data
        if recent and recent[0]["date"] <= invoice_date.isoformat():
            supabase.table("ingredients").update({
                "gross_unit_price": unit_price_ht or None
            }).eq("id", ing_id).execute()

    # ------------------------------------------------------------
    # ETAPE 4 — RECETTES + HISTORY
    # ------------------------------------------------------------
    recipes_histories_created = 0
    recipes_updated = 0

    recipe_ids = list(set([i["recipe_id"] for i in ingredients if i.get("recipe_id")]))

    recipes = supabase.table("recipes").select("*").in_("id", recipe_ids).execute().data
    for r in recipes:
        rid = r["id"]

        # Vérifie s’il y a un historique plus récent
        existing_recent = supabase.table("history_recipes").select("*") \
            .eq("recipe_id", rid).gte("date", invoice_date.isoformat()).execute().data
        if not existing_recent:
            history_payload = {
                "recipe_id": rid,
                "date": invoice_date.isoformat(),
                "gross_cost": r.get("gross_cost"),
                "net_cost": r.get("net_cost"),
                "gross_margin": r.get("gross_margin")
            }
            supabase.table("history_recipes").insert(history_payload).execute()
            recipes_histories_created += 1

        # Met à jour la recette principale si nouvelle date >= dernière
        recent = supabase.table("history_recipes").select("*").eq("recipe_id", rid) \
            .order("date", desc=True).limit(1).execute().data
        if recent and recent[0]["date"] <= invoice_date.isoformat():
            supabase.table("recipes").update({
                "gross_cost": r.get("gross_cost"),
                "net_cost": r.get("net_cost"),
                "gross_margin": r.get("gross_margin")
            }).eq("id", rid).execute()
            recipes_updated += 1

    # ------------------------------------------------------------
    # ETAPE 5 — MARGES
    # ------------------------------------------------------------
    active_recipes = [r for r in recipes if r.get("active") and r.get("sellable")]
    margins_updated = False

    if active_recipes:
        margins_updated = True
        # Calculs de moyenne (ici simplifié, à adapter selon formule métier)
        avg_margin = sum([r.get("gross_margin") or 0 for r in active_recipes]) / len(active_recipes)
        supabase.table("recipe_margins").insert({
            "establishment_id": establishment_id,
            "date": invoice_date.isoformat(),
            "gross_margin": avg_margin
        }).execute()

    # ------------------------------------------------------------
    # ETAPE 6 — VARIATIONS DE PRIX
    # ------------------------------------------------------------
    variations_created = 0

    for ma_id in master_article_ids:
        current_articles = supabase.table("articles").select("*").eq("master_article_id", ma_id) \
            .order("invoice_date", desc=True).execute().data
        if len(current_articles) < 2:
            continue
        previous, current = current_articles[1], current_articles[0]
        prev_price = safe_float(previous.get("unit_price_ht"))
        curr_price = safe_float(current.get("unit_price_ht"))
        if prev_price and curr_price and prev_price != curr_price:
            delta_abs = curr_price - prev_price
            delta_pct = (delta_abs / prev_price) * 100 if prev_price else None
            variation_payload = {
                "master_article_id": ma_id,
                "supplier_id": supplier_id,
                "establishment_id": establishment_id,
                "previous_unit_price_ht": prev_price,
                "current_unit_price_ht": curr_price,
                "delta_abs": delta_abs,
                "delta_pct": delta_pct,
                "effective_date": invoice_date.isoformat()
            }
            supabase.table("variations").insert(variation_payload).execute()
            variations_created += 1

    # ------------------------------------------------------------
    # SORTIE
    # ------------------------------------------------------------
    return {
        "status": "success",
        "invoice_id": invoice_id,
        "supplier_id": supplier_id,
        "articles_created": articles_created,
        "master_articles_created": master_articles_created,
        "ingredients_histories_created": ingredients_histories_created,
        "recipes_histories_created": recipes_histories_created,
        "recipes_updated": recipes_updated,
        "margins_updated": margins_updated,
        "variations_created": variations_created
    }
