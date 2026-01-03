import re
import re
import unidecode
from typing import Dict, Any, Optional, List
from rapidfuzz import fuzz
from app.core.supabase_client import supabase


def clean_name(name: str) -> str:
    """
    Nettoie et normalise le nom d'un article pour un fuzzy matching plus pertinent.
    Supprime unités, quantités, mentions inutiles, accents et espaces multiples.
    Exemple :
        'Tomate cerise bio vrac 3kg x6' → 'tomatecerise'
    """
    if not name:
        return ""
    name = unidecode.unidecode(name.lower())
    name = re.sub(r"[^a-z0-9\s]", " ", name)
    # Suppression des mentions inutiles, formats, conditionnements et unités
    name = re.sub(
    r"\b("
    # Mentions générales
    r"bio|vrac|local|origine|origine\s*france|france|import|extra|premium|standard|eco|"
    r"qualite|qualité|surgele|surgelé|congelé|frais|sec|fume|fumé|cru|cuit|entier|"
    r"décongelé|reconstitué|pasteurisé|stérilisé|ultrafrais|sans\s*sel|sans\s*sucre|sans\s*gluten|"
    r"halal|casher|vegan|végétarien|vegetarien|vege|veggie|nature|classique|tradition|"
    r"artisanal|industriel|saveur|gout|goût|arôme|arome|"
    # Conditionnements et formats
    r"lot|colis|carton|boite|boîte|bouteille|pot|seau|bidon|bac|sachet|poche|pochettes|"
    r"pochette|poc|pack|paquet|cartouche|barquette|plateau|fut|cube|brique|flacon|tube|"
    r"etui|étui|recharge|gros|grand|petit|mini|micro|maxi|format|taille|"
    # Mentions de poids / volume
    r"\d+(kg|kilo|kilogramme|g|gr|gramme|l|litre|litres|cl|ml|milli|centi)|"
    # Mentions de quantité et multi-emballages
    r"x\d+|\d+x\d+|\d+\s?(x|×)\s?\d+|"
    # Mentions de calibre / dimension
    r"calibre|taille|cm|mm|m|diametre|diamètre|longueur|largeur|hauteur|"
    # Mentions de type / pièce
    r"piece|pièce|pce|pcs|unite|unité|"
    # Mentions numériques (code fournisseur, références, n°)
    r"ref|réf|reference|référence|code|n°|numéro|"
    # Mentions de catégorie vague
    r"produit|aliment|denree|denrée|ingredient|ingrédient|"
    # Mentions parasites diverses
    r"nouveau|neuf|promo|offre|special|spécial|test|echantillon|échantillon|"
    r"kg|g|l|ml|cl"
    r")\b",
    " ",
    name,
        )

    name = re.sub(r"\s+", "", name)
    return name.strip()


def master_article_alternatives(
    master_article_id: str,
    establishment_id: str,
    score_min: int = 50,
    limit: int = 50,
    supplier_labels: Optional[List[str]] = None,
    supplier_filter_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Trouve des produits alternatifs à un master_article donné :
    - Fuzzy matching sur les noms produits
    - Filtrage sur le type de fournisseur (ENUM label_supplier.label)
    - Filtrage optionnel sur un fournisseur spécifique
    - Fournit toutes les infos fournisseur pour chaque alternative
    """

    # --- 1. Master_article de référence ---
    master_resp = (
        supabase.table("master_articles")
        .select("id, unformatted_name, name, supplier_id, establishment_id")
        .eq("id", master_article_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    if not master_resp.data:
        return {"error": "Master article not found", "master_article_id": master_article_id}

    master_article = master_resp.data[0]
    reference_name = clean_name(
        master_article.get("unformatted_name")
        or master_article.get("name")
        or ""
    )
    reference_supplier_id = master_article.get("supplier_id")

    # --- 2. Récupération des fournisseurs valides selon les labels ---
    suppliers_query = supabase.table("suppliers").select("*").eq("establishment_id", establishment_id)
    if supplier_labels:
        suppliers_query = suppliers_query.in_("label_id", supplier_labels)

    suppliers_resp = suppliers_query.execute()
    suppliers_data = suppliers_resp.data or []

    valid_supplier_ids = [s["id"] for s in suppliers_data]

    # --- 3. Requête master_articles candidats ---
    query = (
        supabase.table("master_articles")
        .select("id, unformatted_name, name, supplier_id, establishment_id")
        .eq("establishment_id", establishment_id)
        .neq("id", master_article_id)
    )

    if valid_supplier_ids:
        query = query.in_("supplier_id", valid_supplier_ids)

    if supplier_filter_id:
        query = query.eq("supplier_id", supplier_filter_id)

    candidates_resp = query.execute()
    candidates = candidates_resp.data or []

    # --- 4. Calcul du score de similarité ---
    results = []
    for cand in candidates:
        cand_name = clean_name(
            cand.get("unformatted_name")
            or cand.get("name")
            or ""
        )
        score = fuzz.token_sort_ratio(reference_name, cand_name)
        if score < score_min:
            continue

        cand_id = cand.get("id")
        cand_supplier_id = cand.get("supplier_id")

        # --- 5. Dernier article lié ---
        latest_article_resp = (
            supabase.table("articles")
            .select("id, date, unit_price, quantity")
            .eq("master_article_id", cand_id)
            .eq("establishment_id", establishment_id)
            .order("date", desc=True)
            .limit(1)
            .execute()
        )
        latest_article = latest_article_resp.data[0] if latest_article_resp.data else None

        # --- 6. Informations complètes du fournisseur ---
        supplier_resp = (
            supabase.table("suppliers")
            .select("*")  # toutes les infos fournisseur
            .eq("id", cand_supplier_id)
            .eq("establishment_id", establishment_id)
            .limit(1)
            .execute()
        )
        supplier = supplier_resp.data[0] if supplier_resp.data else None

        # --- 7. Ajouter au résultat ---
        results.append(
            {
                "similarity_score": round(score, 2),
                "master_article": cand,
                "latest_article": latest_article,
                "supplier": supplier,
            }
        )

    # --- 8. Tri et limitation ---
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    results = results[:limit]

    # --- 9. Retour final ---
    return {
        "master_article": master_article,
        "alternatives": results,
        "filters": {
            "establishment_id": establishment_id,
            "supplier_labels": supplier_labels or [],
            "supplier_filter_id": supplier_filter_id,
            "score_min": score_min,
            "limit": limit,
        },
    }
