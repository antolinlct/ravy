from datetime import date
from typing import Dict, Any, Optional
from dateutil.relativedelta import relativedelta
from app.core.supabase_client import supabase


def get_month_bounds(target_date: Optional[date] = None):
    """Retourne le 1er et le dernier jour du mois courant (fallback)."""
    target_date = target_date or date.today()
    first_day = target_date.replace(day=1)
    next_month = first_day + relativedelta(months=1)
    last_day = next_month - relativedelta(days=1)
    return first_day, last_day


def recipe_ingredients_analysis(
    recipe_id: str,
    establishment_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Dict[str, Any]:
    """
    Analyse détaillée des ingrédients d'une recette :
    - Tous les ingrédients (ARTICLE + SUBRECIPE)
    - Coût par portion
    - % du coût dans la recette
    - Variation prix / coût sur la période
    - Impact du master_article sur la variation du coût total recette
    """

    # --- 1. Période par défaut ---
    if not start_date or not end_date:
        start_date, end_date = get_month_bounds()

    # --- 2. Récupération de la recette ---
    recipe_resp = (
        supabase.table("recipes")
        .select("id, name, purchase_cost_per_portion, price_excl_tax, portions")
        .eq("id", recipe_id)
        .eq("establishment_id", establishment_id)
        .limit(1)
        .execute()
    )
    if not recipe_resp.data:
        return {"error": "Recipe not found", "recipe_id": recipe_id}

    recipe = recipe_resp.data[0]
    recipe_cost_per_portion = recipe.get("purchase_cost_per_portion") or 0
    portions = recipe.get("portions") or 1

    # --- 3. Récupération des ingrédients liés ---
    ingredients_resp = (
        supabase.table("ingredients")
        .select(
            "id, ingredient_type, quantity, unit_cost, master_article_id, subrecipe_id, establishment_id"
        )
        .eq("recipe_id", recipe_id)
        .eq("establishment_id", establishment_id)
        .execute()
    )
    ingredients = ingredients_resp.data or []

    if not ingredients:
        return {
            "recipe": recipe,
            "ingredients": [],
            "period": {"start": str(start_date), "end": str(end_date)},
        }

    results = []

    # --- 4. Boucle sur chaque ingrédient ---
    for ing in ingredients:
        ing_type = ing.get("ingredient_type")
        master_article_id = ing.get("master_article_id")
        subrecipe_id = ing.get("subrecipe_id")
        unit_cost = ing.get("unit_cost") or 0
        quantity = ing.get("quantity") or 0

        # --- 4.1. Si ingrédient de type ARTICLE ---
        if ing_type == "ARTICLE" and master_article_id:
            master_resp = (
                supabase.table("master_articles")
                .select("id, name_raw, supplier_id, market_master_article_id")
                .eq("id", master_article_id)
                .limit(1)
                .execute()
            )
            master_article = master_resp.data[0] if master_resp.data else None

            # Historique de prix sur la période
            history_resp = (
                supabase.table("history_ingredients")
                .select("date, unit_price")
                .eq("master_article_id", master_article_id)
                .eq("establishment_id", establishment_id)
                .gte("date", str(start_date))
                .lte("date", str(end_date))
                .order("date")
                .execute()
            )
            history = history_resp.data or []

            variation_euro = 0
            variation_percent = 0
            if len(history) >= 2:
                first_price = history[0]["unit_price"]
                last_price = history[-1]["unit_price"]
                variation_euro = round(last_price - first_price, 3)
                variation_percent = (
                    round((variation_euro / first_price * 100), 2) if first_price else 0
                )

            # Coût par portion de l’ingrédient
            cost_per_portion = round(unit_cost / portions, 3)

            # % du coût total de la recette
            percent_on_recipe_cost = (
                round((cost_per_portion / recipe_cost_per_portion * 100), 2)
                if recipe_cost_per_portion
                else 0
            )

            # Impact sur le coût total recette (variation × quantité)
            impact_euro = round((variation_euro * quantity) / portions, 3)
            impact_percent = (
                round((impact_euro / recipe_cost_per_portion * 100), 2)
                if recipe_cost_per_portion
                else 0
            )

            results.append(
                {
                    "ingredient_id": ing["id"],
                    "ingredient_type": "ARTICLE",
                    "quantity": quantity,
                    "unit_cost": unit_cost,
                    "cost_per_portion": cost_per_portion,
                    "percent_on_recipe_cost": percent_on_recipe_cost,
                    "variation_ingredient_euro": variation_euro,
                    "variation_ingredient_percent": variation_percent,
                    "impact_on_recipe_euro": impact_euro,
                    "impact_on_recipe_percent": impact_percent,
                    "history": history,
                    "master_article": master_article,
                }
            )

        # --- 4.2. Si ingrédient de type SUBRECIPE ---
        elif ing_type == "SUBRECIPE" and subrecipe_id:
            subrecipe_resp = (
                supabase.table("recipes")
                .select("id, name, purchase_cost_per_portion, portions")
                .eq("id", subrecipe_id)
                .eq("establishment_id", establishment_id)
                .limit(1)
                .execute()
            )
            subrecipe = subrecipe_resp.data[0] if subrecipe_resp.data else None

            sub_cost_per_portion = (
                subrecipe["purchase_cost_per_portion"] if subrecipe else 0
            )
            cost_per_portion = round((sub_cost_per_portion * quantity) / portions, 3)

            percent_on_recipe_cost = (
                round((cost_per_portion / recipe_cost_per_portion * 100), 2)
                if recipe_cost_per_portion
                else 0
            )

            # Pas de variation d’ingrédient directe ici, car dépend de sa composition
            results.append(
                {
                    "ingredient_id": ing["id"],
                    "ingredient_type": "SUBRECIPE",
                    "quantity": quantity,
                    "unit_cost": sub_cost_per_portion,
                    "cost_per_portion": cost_per_portion,
                    "percent_on_recipe_cost": percent_on_recipe_cost,
                    "variation_ingredient_euro": None,
                    "variation_ingredient_percent": None,
                    "impact_on_recipe_euro": None,
                    "impact_on_recipe_percent": None,
                    "history": [],
                    "subrecipe": subrecipe,
                }
            )

    # --- 5. Résultat final ---
    return {
        "recipe": recipe,
        "ingredients": results,
        "period": {"start": str(start_date), "end": str(end_date)},
    }
