from app.core.supabase_client import supabase
from app.schemas.recipes_subcategories import RecipesSubcategories

def get_all_recipes_subcategories(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("recipes_subcategories").select("*")
    if not filters:
        filters = {}

    # --- Filtres dynamiques (structurels ou contextuels) ---
    # Aucun filtre structurel spécifique


    # --- Filtres additionnels (_gte, _lte, etc.) ---
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "page", ):
            continue
        if key.endswith("_gte"):
            query = query.gte(key[:-4], value)
        elif key.endswith("_lte"):
            query = query.lte(key[:-4], value)
        elif key.endswith("_like"):
            query = query.like(key[:-5], f"%{value}%")
        elif key.endswith("_neq"):
            query = query.neq(key[:-4], value)
        else:
            query = query.eq(key, value)

    # --- Tri & Pagination ---
    if "order_by" in filters:
        query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")

    start = (page - 1) * limit
    end = start + limit - 1
    query = query.range(start, end)

    response = query.execute()
    return [RecipesSubcategories(**r) for r in (response.data or [])]


def get_recipes_subcategories_by_id(id: int):
    response = supabase.table("recipes_subcategories").select("*").eq("id", id).single().execute()
    return RecipesSubcategories(**response.data) if response.data else None


def create_recipes_subcategories(payload: dict):
    response = supabase.table("recipes_subcategories").insert(payload).execute()
    return response.data[0] if response.data else None


def update_recipes_subcategories(id: int, payload: dict):
    response = supabase.table("recipes_subcategories").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_recipes_subcategories(id: int):
    supabase.table("recipes_subcategories").delete().eq("id", id).execute()
    return {"deleted": True}
