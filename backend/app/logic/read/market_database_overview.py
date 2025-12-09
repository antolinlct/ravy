from __future__ import annotations
from datetime import date
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple
from collections import defaultdict
from dateutil.relativedelta import relativedelta

from app.core.supabase_client import supabase


def _to_decimal(value: Any) -> Optional[Decimal]:
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _quantize(value: Optional[Decimal], exp: str = "0.001") -> float:
    if value is None:
        return 0.0
    return float(value.quantize(Decimal(exp), rounding=ROUND_HALF_UP))


# =============================
# Period helpers
# =============================

def _period_last_months(months: int, today: Optional[date] = None) -> Tuple[date, date]:
    today = today or date.today()
    # Début = 1er jour du mois, (months-1) mois en arrière
    start = (today.replace(day=1) - relativedelta(months=months - 1)).replace(day=1)
    # Fin = dernier jour du mois courant
    next_month = today.replace(day=1) + relativedelta(months=1)
    end = next_month - relativedelta(days=1)
    return start, end

    # Indications :
    # - Garder ce calcul aligné avec les attentes des services (mois civil complet) et préciser le pas de temps utilisé pour les exports marché.
    # - Mentionner la vérification à ajouter lorsque start/end sont fournis partiellement (aujourd'hui priorité sur dates explicites?).
    # Tests robustes :
    # - Couvrir les bascules décembre/janvier et les valeurs months personnalisées pour s’assurer du respect des bornes inclusives.
    # - Simuler une timezone différente pour confirmer que la borne jour reste cohérente avec Supabase.


def _ensure_period(
    start_date: Optional[date],
    end_date: Optional[date],
    period_range: Optional[int] = 3,
) -> Tuple[date, date]:
    """
    Si des dates sont fournies → priorité à ces dates.
    Sinon → fallback sur 3/6/12 derniers mois (défaut 3).
    """
    if start_date and end_date:
        return start_date, end_date
    months = period_range if period_range in (3, 6, 12) else 3
    return _period_last_months(months)

    # Indications :
    # - Valider les dates entrantes (start <= end) et journaliser le fallback automatique pour traçabilité métier.
    # - Noter la modification à prévoir : accepter un start_date sans end_date (ou l'inverse) au lieu d'ignorer la date fournie.
    # - Tracer le period_range retenu pour comparer avec les requêtes front.
    # Tests robustes :
    # - Simuler des entrées partiellement fournies (start sans end) et des period_range hors liste pour vérifier le fallback par défaut.
    # - Couvrir des dates inversées pour s'assurer que la validation amont rejette la plage.


# =============================
# Fetchers
# =============================

def _fetch_market_suppliers(supplier_id: Optional[str]) -> List[Dict[str, Any]]:
    q = supabase.table("market_suppliers").select("*")
    if supplier_id:
        q = q.eq("id", supplier_id).limit(1)
    res = q.execute()
    return res.data or []

    # Indications :
    # - Contrôler les erreurs de requête Supabase et vérifier la cohérence des IDs avec le schéma marché (market_suppliers.id).
    # - Ajouter un log métier lorsque aucun fournisseur n'est retourné pour alerter les flux d'import.
    # Tests robustes :
    # - Mocker Supabase pour renvoyer une erreur, un fournisseur unique et une liste vide afin de valider les chemins de retour.
    # - Simuler un supplier_id non présent en base pour vérifier le comportement du limit(1).


def _fetch_market_articles(
    supplier_id: str,
    product_id: str,
    start: date,
    end: date,
) -> List[Dict[str, Any]]:
    res = (
        supabase.table("market_articles")
        .select("unit_price, date")
        .eq("market_supplier_id", supplier_id)
        .eq("market_master_article_id", product_id)
        .gte("date", str(start))
        .lte("date", str(end))
        .order("date")
        .execute()
    )
    rows = res.data or []
    rows = [r for r in rows if r.get("date")]
    rows.sort(key=lambda r: r.get("date"))
    return rows

    # Indications :
    # - S'assurer que les filtres fournisseur/produit sont validés en amont et que les dates sont au format ISO pour éviter des résultats vides.
    # - Noter la modification à prévoir : remonter le nombre d'observations pour chaque produit afin d'évaluer la fiabilité.
    # Tests robustes :
    # - Injecter des dates invalides et des IDs inexistants pour vérifier la gestion des réponses vides et la robustesse des filtres.
    # - Couvrir des plages inversées (start > end) pour confirmer le rejet amont.


def _fetch_user_articles_for_product(
    establishment_id: str,
    market_master_article_id: str,
    start: date,
    end: date,
) -> List[Dict[str, Any]]:
    # Master articles utilisateur liés à ce market_master_article
    master_ids_resp = (
        supabase.table("master_articles")
        .select("id")
        .eq("market_master_article_id", market_master_article_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    master_ids = [m["id"] for m in (master_ids_resp.data or [])]
    if not master_ids:
        return []
    res = (
        supabase.table("articles")
        .select("unit_price, date")
        .in_("master_article_id", master_ids)
        .gte("date", str(start))
        .lte("date", str(end))
        .order("date")
        .execute()
    )
    rows = res.data or []
    rows = [r for r in rows if r.get("date")]
    rows.sort(key=lambda r: r.get("date"))
    return rows

    # Indications :
    # - Vérifier la correspondance des master_articles avec l'établissement (public.master_articles.establishment_id) et traiter les réponses vides sans interrompre l'appel principal.
    # - Ajouter un log si aucun master_article n'est mappé (modification nécessaire) pour faciliter les corrections de mapping.
    # Tests robustes :
    # - Mocker une absence de master_articles, des dates hors plage ou des prix None pour confirmer que la fonction retourne bien une liste vide sans lever d'erreur.


# =============================
# Metrics helpers
# =============================

def _daily_avg_series(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Série quotidienne moyenne (utile pour un graph lissé, 1 point/jour)."""
    if not rows:
        return []
    by_day: Dict[str, List[Decimal]] = defaultdict(list)
    for r in rows:
        p = r.get("unit_price")
        d = r.get("date")
        if p is None or not d:
            continue
        price = _to_decimal(p)
        if price is None:
            continue
        by_day[d].append(price)
    return [
        {"date": d, "avg_unit_price": _quantize(sum(vals) / len(vals))}
        for d, vals in sorted(by_day.items())
    ]

    # Indications :
    # - Filtrer en amont les données sans date ou prix et envisager de forcer l'ordre chronologique avant l'agrégation.
    # - Prévoir des métriques de performance sur de gros volumes pour anticiper la latence côté front.
    # Tests robustes :
    # - Vérifier que les doublons de dates sont bien moyennés et que les séries non triées produisent une sortie triée chronologiquement.
    # - Simuler des prix à 0/None pour confirmer leur exclusion contrôlée.


def _stats_basic(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Moyenne, min, max, dernier prix/date, volume d’achats, plage de volatilité."""
    if not rows:
        return {
            "avg_unit_price": 0,
            "min_unit_price": None,
            "max_unit_price": None,
            "last_unit_price": None,
            "last_purchase_date": None,
            "count_purchases": 0,
            "volatility_range": None,
        }
    rows_sorted = sorted(rows, key=lambda r: r.get("date") or "")
    prices = []
    for r in rows_sorted:
        if r.get("unit_price") is None:
            continue
        price = _to_decimal(r.get("unit_price"))
        if price is None:
            continue
        prices.append(price)
    if not prices:
        return {
            "avg_unit_price": 0,
            "min_unit_price": None,
            "max_unit_price": None,
            "last_unit_price": None,
            "last_purchase_date": rows_sorted[-1].get("date") if rows_sorted else None,
            "count_purchases": len(rows_sorted),
            "volatility_range": None,
        }
    avg_price = _quantize(sum(prices) / len(prices))
    min_price = _quantize(min(prices))
    max_price = _quantize(max(prices))
    last_row = rows_sorted[-1]
    return {
        "avg_unit_price": avg_price,
        "min_unit_price": min_price,
        "max_unit_price": max_price,
        "last_unit_price": _quantize(_to_decimal(last_row["unit_price"])),
        "last_purchase_date": last_row["date"],
        "count_purchases": len(rows_sorted),
        "volatility_range": f"{min_price}€ → {max_price}€",
    }

    # Indications :
    # - Couvrir les cas de listes vides ou prix None et aligner les arrondis avec les attentes front.
    # - Mentionner la modification à prévoir : renvoyer médiane/écart-type et un compteur d'observations utilisés pour les stats.
    # Tests robustes :
    # - Simuler des prix négatifs, None ou à 0 et valider le formatage des stats renvoyées (arrondis, last_purchase_date) même avec un seul enregistrement.
    # - Vérifier que count_purchases reflète bien le nombre de lignes initiales (y compris celles sans prix).


def _variation_over_period(rows: List[Dict[str, Any]]) -> Tuple[Optional[float], Optional[float]]:
    """Variation entre le 1er et le dernier enregistrements de la période."""
    if not rows or len(rows) < 2:
        return None, None
    rows_sorted = sorted(rows, key=lambda r: r.get("date") or "")
    first = _to_decimal(rows_sorted[0].get("unit_price"))
    last = _to_decimal(rows_sorted[-1].get("unit_price"))
    if first is None or last is None:
        return None, None
    diff = _quantize(last - first)
    pct = (
        float(((last - first) / first * Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
        if first
        else None
    )
    return diff, pct

    # Indications :
    # - Garantir que les lignes sont triées chronologiquement (sinon trier ici) et gérer les prix nuls pour éviter des pourcentages infinis.
    # - Consigner la date des premiers/derniers points pour vérifier la cohérence avec le périmètre demandé.
    # Tests robustes :
    # - Injecter des lignes désordonnées et des prix zéro pour s'assurer que diff/pct restent stables et que None est renvoyé si insuffisant.
    # - Tester une seule observation pour vérifier le retour (None, None).


def _market_volatility_index(stats: Dict[str, Any]) -> Optional[float]:
    """(max - min) / avg → indice de volatilité relatif (0 = très stable)."""
    avg_p = _to_decimal(stats.get("avg_unit_price"))
    min_p = _to_decimal(stats.get("min_unit_price")) if stats.get("min_unit_price") is not None else None
    max_p = _to_decimal(stats.get("max_unit_price")) if stats.get("max_unit_price") is not None else None
    if not avg_p or min_p is None or max_p is None:
        return None
    return _quantize((max_p - min_p) / avg_p)

    # Indications :
    # - Valider que les stats proviennent de _stats_basic et ajouter un garde-fou explicite pour avg_p proche de zéro.
    # - Envisager d'exposer un niveau de confiance basé sur le volume d'observations.
    # Tests robustes :
    # - Couvrir les cas avg_unit_price=0 ou None pour vérifier que l'indice retourne None et ne lève pas d'exception.
    # - Injecter des valeurs min/max identiques pour vérifier l'indice 0.


def _trend_label(variation_eur: Optional[float]) -> str:
    if variation_eur is None:
        return "STABLE"
    if variation_eur > 0:
        return "UP"
    if variation_eur < 0:
        return "DOWN"
    return "STABLE"

    # Indications :
    # - Garder la convention de libellés en phase avec le front et documenter les seuils utilisés pour les alertes produit.
    # - Mentionner la modification à prévoir : externaliser les seuils dans la config produit pour éviter les valeurs en dur.
    # Tests robustes :
    # - Vérifier le retour sur variations positives, négatives, nulles et None afin d'assurer la stabilité des badges front.


def _days_since_last(last_date_str: Optional[str]) -> Optional[int]:
    if not last_date_str:
        return None
    try:
        parsed = date.fromisoformat(last_date_str)
        return (date.today() - parsed).days
    except Exception:
        return None

    # Indications :
    # - Valider le format de date (YYYY-MM-DD) avant appel, gérer la timezone côté service et prévoir un fallback si la date est invalide.
    # - Mentionner la modification à prévoir : utiliser datetime.fromisoformat pour limiter les split() manuels et améliorer la robustesse.
    # Tests robustes :
    # - Injecter des dates invalides et des strings vides pour vérifier que None est renvoyé sans casser l'analyse.
    # - Simuler une date future pour vérifier le nombre de jours négatif.


def _user_vs_market(user_avg: Optional[float], market_avg: Optional[float]) -> Tuple[Optional[float], Optional[float]]:
    """Diff utilisateur vs marché (€, %) – safe contre None/0."""
    if user_avg is None or market_avg in (None, 0):
        return None, None
    diff_eur = _quantize(_to_decimal(user_avg) - _to_decimal(market_avg))
    diff_pct = float(
        (
            (_to_decimal(user_avg) - _to_decimal(market_avg))
            / _to_decimal(market_avg)
            * Decimal("100")
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    )
    return diff_eur, diff_pct

    # Indications :
    # - Protéger contre les valeurs négatives inattendues et consigner l'usage de market_avg=0 pour éviter des divisions par zéro.
    # - Envisager d'exposer la différence absolue en plus du pourcentage pour améliorer la lisibilité front.
    # Tests robustes :
    # - Couvrir user_avg None, market_avg=0 et des valeurs négatives pour garantir des retours None sécurisés ou des pourcentages cohérents.
    # - Vérifier la cohérence des arrondis avec les exports.


def _deal_score(user_vs_market_percent: Optional[float], volatility_index: Optional[float]) -> Optional[float]:
    """Score composite ∈ [0,1] (1 = excellent) basé sur écart relatif et volatilité."""
    if user_vs_market_percent is None or volatility_index is None:
        return None
    vol = max(Decimal("0"), min(Decimal("1"), _to_decimal(volatility_index)))
    rel = max(
        Decimal("0"),
        min(Decimal("1"), abs(_to_decimal(user_vs_market_percent)) / Decimal("100")),
    )
    return _quantize((Decimal("1") - rel) * (Decimal("1") - vol))

    # Indications :
    # - Valider l'intervalle [0,1] attendu pour les entrées et synchroniser la formule avec la logique métier des badges front.
    # - Tracer le score brut pour suivre les évolutions et mentionner la possibilité de pondérer par le volume d'observations.
    # Tests robustes :
    # - Injecter des valeurs limites (0, 1, >1) pour volatility_index et user_vs_market_percent afin de vérifier le clamp et les arrondis.
    # - Couvrir des valeurs négatives pour confirmer le clamp à 0.


def _recommendation_badge(
    user_vs_market_percent: Optional[float],
    volatility_index: Optional[float],
    days_since_last: Optional[int],
) -> Optional[str]:
    if user_vs_market_percent is not None and user_vs_market_percent < -5:
        return "Très bon prix"
    if user_vs_market_percent is not None and user_vs_market_percent > 5:
        return "À surveiller"
    if volatility_index is not None and volatility_index > 0.2:
        return "Prix instable"
    if days_since_last is not None and days_since_last > 30:
        return "Données anciennes"
    return None

    # Indications :
    # - Aligner les seuils (-5%, +5%, >30 jours) avec les spécifications produit et prévoir une localisation éventuelle des textes.
    # - Mentionner la modification à prévoir : exposer la source des données (utilisateur vs marché) pour aider le front dans l'affichage.
    # Tests robustes :
    # - Couvrir toutes les branches (écart < -5, > 5, volatilité > 0.2, données anciennes) pour garantir l'ordre des priorités.
    # - Tester des combinaisons où plusieurs conditions sont vraies pour vérifier la priorité actuelle.


def _is_good_time_to_buy(series_daily: List[Dict[str, Any]], window_days: int = 14) -> Optional[bool]:
    """
    Heuristique : compare la moyenne des 14 derniers jours à la moyenne globale.
    True  → bon moment (>= 3% moins cher)
    False → mauvais moment (>= 3% plus cher)
    None  → neutre / données insuffisantes
    """
    if not series_daily:
        return None
    prices = []
    for p in series_daily:
        if p.get("avg_unit_price") is None:
            continue
        dec_price = _to_decimal(p.get("avg_unit_price"))
        if dec_price is None:
            continue
        prices.append(dec_price)
    if not prices:
        return None
    period_avg = _to_decimal(sum(prices) / len(prices))
    tail = prices[-min(window_days, len(prices)):]
    if not tail:
        return None
    tail_avg = _to_decimal(sum(tail) / len(tail))
    if period_avg == 0:
        return None
    delta = (tail_avg - period_avg) / period_avg
    if delta <= -0.03:
        return True
    if delta >= 0.03:
        return False
    return None

    # Indications :
    # - Vérifier que la série est déjà triée et ajuster le seuil 3% selon la stratégie achat ; renvoyer en option la moyenne glissante utilisée pour audit.
    # - Mentionner la modification à prévoir : gérer explicitement les séries avec moins de deux points pour éviter des tails vides.
    # Tests robustes :
    # - Simuler des séries courtes, des window_days > longueur et des prix constants ou oscillants pour confirmer le retour True/False/None attendu.
    # - Injecter des valeurs None ou 0 dans avg_unit_price pour vérifier l'exclusion contrôlée.


# =============================
# Main logic
# =============================

def market_database_overview(
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    supplier_id: Optional[str] = None,
    include_user_comparison: bool = True,
    period_range: Optional[int] = 3,
) -> Dict[str, Any]:
    """
    Vue agrégée des prix marché par fournisseur → produits.
    - Période fallback: 3, 6 ou 12 derniers mois (`period_range`)
    - Si des dates sont fournies, elles prennent le dessus.
    - Enrichissements: séries journalières, variation, volatilité, tendance, derniers prix,
      comparaison utilisateur (moyenne/dernier/écarts), deal_score, badges, “bon moment”.
    """
    start, end = _ensure_period(start_date, end_date, period_range)

    suppliers = _fetch_market_suppliers(supplier_id)
    if not suppliers:
        return {"period": {"start": str(start), "end": str(end)}, "suppliers": []}

    result_suppliers: List[Dict[str, Any]] = []

    for sup in suppliers:
        sup_id = sup.get("id")

        # Produits (market_master_article_id) avec activité pour ce fournisseur, dans la période
        prod_resp = (
            supabase.table("market_articles")
            .select("market_master_article_id")
            .eq("market_supplier_id", sup_id)
            .gte("date", str(start))
            .lte("date", str(end))
            .execute()
        )
        product_ids = list({
            r["market_master_article_id"]
            for r in (prod_resp.data or [])
            if r.get("market_master_article_id")
        })

        products_block: List[Dict[str, Any]] = []
        if product_ids:
            # Métadonnées produit (en chunks de 500)
            chunks = [product_ids[i:i + 500] for i in range(0, len(product_ids), 500)]
            meta_map: Dict[str, Dict[str, Any]] = {}
            for chunk in chunks:
                mm = (
                    supabase.table("market_master_articles")
                    .select("*")
                    .in_("id", chunk)
                    .execute()
                )
                for row in (mm.data or []):
                    meta_map[row["id"]] = row

            # Boucle par produit
            for product_id in product_ids:
                market_rows = _fetch_market_articles(sup_id, product_id, start, end)
                series_daily = _daily_avg_series(market_rows)
                stats = _stats_basic(market_rows)
                var_eur, var_pct = _variation_over_period(market_rows)
                vol_index = _market_volatility_index(stats)
                trend = _trend_label(var_eur)
                days_last = _days_since_last(stats.get("last_purchase_date"))
                good_time = _is_good_time_to_buy(series_daily)

                user_avg: Optional[float] = None
                user_last: Optional[float] = None
                user_vs_eur: Optional[float] = None
                user_vs_pct: Optional[float] = None
                potential_saving: Optional[float] = None
                user_rows: List[Dict[str, Any]] = []

                if include_user_comparison:
                    user_rows = _fetch_user_articles_for_product(
                        establishment_id=establishment_id,
                        market_master_article_id=product_id,
                        start=start,
                        end=end,
                    )
                    if user_rows:
                        user_prices = []
                        for r in user_rows:
                            if r.get("unit_price") is None:
                                continue
                            price = _to_decimal(r.get("unit_price"))
                            if price is None:
                                continue
                            user_prices.append(price)
                        if user_prices:
                            user_avg_dec = sum(user_prices) / len(user_prices)
                            user_avg = _quantize(user_avg_dec)
                            user_last = _quantize(_to_decimal(user_rows[-1]["unit_price"]))
                            user_vs_eur, user_vs_pct = _user_vs_market(
                                user_avg,
                                stats.get("avg_unit_price") or 0,
                            )
                            # Économie potentielle simple: si l'utilisateur paye + cher que la moyenne marché
                            if user_vs_eur is not None and user_vs_eur > 0 and len(user_rows) > 0:
                                potential_saving = float(
                                    (
                                        Decimal(str(user_vs_eur))
                                        * Decimal(len(user_rows))
                                    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                                )

                deal = _deal_score(user_vs_pct, vol_index)
                badge = _recommendation_badge(user_vs_pct, vol_index, days_last)

                products_block.append({
                    "market_master_article": meta_map.get(product_id),
                    "series_daily": series_daily,
                    "stats": {
                        **stats,
                        "variation_euro": var_eur,
                        "variation_percent": var_pct,
                        "market_volatility_index": vol_index,
                        "trend": trend,
                        "days_since_last": days_last,
                        "is_good_time_to_buy": good_time,
                    },
                    "user": {
                        "has_purchased": bool(user_rows),
                        "user_avg_unit_price": user_avg,
                        "user_last_unit_price": user_last,
                        "user_vs_market_eur": user_vs_eur,
                        "user_vs_market_percent": user_vs_pct,
                        "potential_saving_eur": potential_saving,
                        "deal_score": deal,
                        "recommendation_badge": badge,
                    },
                })

        result_suppliers.append({"market_supplier": sup, "products": products_block})

    return {"period": {"start": str(start), "end": str(end)}, "suppliers": result_suppliers}

    # Indications :
    # - Sécuriser l'entrée establishment_id (cohérent avec l'auth) et tracer les erreurs Supabase par fournisseur/produit.
    # - Mentionner la modification à prévoir : paginer les produits si la liste est volumineuse et exposer le nombre d'observations marché/utilisateur pour juger la fiabilité.
    # - Tester include_user_comparison=False pour éviter des requêtes inutiles et signaler toute incohérence de mapping market_master_article_id entre market_articles et master_articles.
    # Tests robustes :
    # - Mocker des fournisseurs sans produits, des séries marché vides et des user_rows absents pour vérifier la résilience des blocs produits et la stabilité des statistiques (deal_score, badges, is_good_time_to_buy).
    # - Simuler des produits avec meta manquantes ou des chunks >500 pour confirmer le découpage et la robustesse des retours.
