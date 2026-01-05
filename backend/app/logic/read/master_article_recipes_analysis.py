from datetime import date
from typing import Dict, Any, Optional
from datetime import date
from dateutil.relativedelta import relativedelta
from app.core.supabase_client import supabase


def get_month_bounds(target_date: Optional[date] = None):
    """Retourne le 1er et le dernier jour du mois courant (fallback)."""
    target_date = target_date or date.today()
    first_day = target_date.replace(day=1)
    next_month = first_day + relativedelta(months=1)
    last_day = next_month - relativedelta(days=1)
    return first_day, last_day


def master_article_impact_analysis(
    master_article_id: str,
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Analyse l’impact d’un master_article sur toutes les recettes qui l’utilisent :
    - Recettes directes (type = ARTICLE)
    - Recettes indirectes via sous-recettes (type = SUBRECIPE)
    - Calcul du coût par portion, du % du coût dans la recette, et des variations
    - Retourne un flag is_subrecipe pour filtrage côté front
    """

    # --- 1. Gestion de la période ---
    if not start_date or not end_date:
        start_date, end_date = get_month_bounds()

    # --- 2. Ingrédients directs liés à ce master_article ---
    direct_ing_resp = (
        supabase.table("ingredients")
        .select("id, recipe_id, type, master_article_id, quantity, unit_cost")
        .eq("type", "ARTICLE")
        .eq("master_article_id", master_article_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    direct_ingredients = direct_ing_resp.data or []
    direct_recipe_ids = list({i["recipe_id"] for i in direct_ingredients})

    # --- 3. Ingrédients de type sous-recette ---
    sub_ing_resp = (
        supabase.table("ingredients")
        .select("id, recipe_id, type, subrecipe_id, quantity")
        .eq("type", "SUBRECIPE")
        .eq("establishment_id", establishment_id)
        .execute()
    )
    sub_ingredients = sub_ing_resp.data or []

    # Trouver les sous-recettes contenant le master_article
    subrecipes_with_article_resp = (
        supabase.table("ingredients")
        .select("recipe_id")
        .eq("type", "ARTICLE")
        .eq("master_article_id", master_article_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    subrecipes_ids = list({r["recipe_id"] for r in subrecipes_with_article_resp.data or []})

    # Trouver les recettes finales utilisant ces sous-recettes
    indirect_recipe_ids = list({
        i["recipe_id"]
        for i in sub_ingredients
        if i.get("subrecipe_id") in subrecipes_ids
    })

    all_recipe_ids = list(set(direct_recipe_ids + indirect_recipe_ids))

    if not all_recipe_ids:
        return {
            "master_article_id": master_article_id,
            "recipes": [],
            "period": {"start": str(start_date), "end": str(end_date)},
        }

    # --- 4. Récupérer les recettes concernées ---
    recipes_resp = (
        supabase.table("recipes")
        .select("id, name, price_excl_tax, purchase_cost_per_portion, portion")
        .in_("id", all_recipe_ids)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    recipes = recipes_resp.data or []

    # --- 5. Historique de prix du master_article sur la période ---
    hist_resp = (
        supabase.table("history_ingredients")
        .select("unit_cost, date")
        .eq("master_article_id", master_article_id)
        .eq("establishment_id", establishment_id)
        .gte("date", str(start_date))
        .lte("date", str(end_date))
        .order("date")
        .execute()
    )
    history = hist_resp.data or []

    variation_ingredient_euro = None
    variation_ingredient_percent = None
    if len(history) >= 2:
        first_price = history[0].get("unit_cost")
        last_price = history[-1].get("unit_cost")
        if first_price is not None and last_price is not None:
            variation_ingredient_euro = round(last_price - first_price, 3)
            variation_ingredient_percent = round(
                ((last_price - first_price) / first_price * 100) if first_price else 0, 2
            )

    # --- 6. Calculs par recette ---
    results = []

    for recipe in recipes:
        recipe_id = recipe["id"]
        recipe_price_ht = recipe.get("price_excl_tax") or 0
        purchase_cost_per_portion = recipe.get("purchase_cost_per_portion") or 0
        portions = recipe.get("portion") or 1

        # Ingrédients directs et indirects pour cette recette
        ing_direct = [i for i in direct_ingredients if i["recipe_id"] == recipe_id]
        ing_indirect = [i for i in sub_ingredients if i["recipe_id"] == recipe_id and i.get("subrecipe_id") in subrecipes_ids]

        # Déterminer si cette recette provient d’une sous-recette
        is_subrecipe = recipe_id in indirect_recipe_ids

        total_cost_portion = 0
        total_quantity = 0

        # --- Coût direct ---
        for ing in ing_direct:
            q = ing.get("quantity") or 0
            unit_cost = ing.get("unit_cost") or 0
            total_quantity += q
            total_cost_portion += (unit_cost / portions)

        # --- Coût indirect (via sous-recette) ---
        for ing in ing_indirect:
            sub_id = ing["subrecipe_id"]
            sub_q = ing.get("quantity") or 0
            subrecipe_resp = (
                supabase.table("recipes")
                .select("purchase_cost_per_portion")
                .eq("id", sub_id)
                .eq("establishment_id", establishment_id)
                .limit(1)
                .execute()
            )
            sub_cost = (
                subrecipe_resp.data[0]["purchase_cost_per_portion"]
                if subrecipe_resp.data
                else 0
            )
            total_cost_portion += (sub_cost * sub_q) / portions

        # Impact en % sur le prix de vente HT
        cost_percent_on_selling_price = (
            round((total_cost_portion / recipe_price_ht * 100), 2)
            if recipe_price_ht
            else 0
        )

        # Variation du coût par portion
        if len(history) >= 2:
            first_price = history[0].get("unit_cost")
            last_price = history[-1].get("unit_cost")
            if first_price is not None and last_price is not None:
                var_cost_euro = round((last_price - first_price) / portions, 3)
                var_cost_percent = (
                    round(((last_price - first_price) / first_price * 100), 2)
                    if first_price
                    else 0
                )
            else:
                var_cost_euro = 0
                var_cost_percent = 0
        else:
            var_cost_euro = 0
            var_cost_percent = 0

        results.append(
            {
                "recipe_id": recipe_id,
                "recipe_name": recipe["name"],
                "purchase_cost_per_portion": purchase_cost_per_portion,
                "selling_price_ht": recipe_price_ht,
                "ingredient_quantity": round(total_quantity, 3),
                "cost_per_portion": round(total_cost_portion, 3),
                "cost_percent_on_selling_price": cost_percent_on_selling_price,
                "variation_ingredient_euro": variation_ingredient_euro,
                "variation_ingredient_percent": variation_ingredient_percent,
                "variation_cost_per_portion_euro": var_cost_euro,
                "variation_cost_per_portion_percent": var_cost_percent,
                "is_subrecipe": is_subrecipe,  # ← flag explicite
            }
        )

    # --- 7. Résultat final ---
    return {
        "master_article_id": master_article_id,
        "period": {"start": str(start_date), "end": str(end_date)},
        "recipes": results,
    }
