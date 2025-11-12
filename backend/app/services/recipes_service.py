from app.core.supabase_client import supabase
from app.schemas.recipes import Recipes

def get_all_recipes(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("recipes").select("*")
    if not filters:
        filters = {}

    # --- Filtres dynamiques (structurels ou contextuels) ---
    if "establishment_id" in filters:
        query = query.eq("establishment_id", filters["establishment_id"])


    # --- Filtres additionnels (_gte, _lte, etc.) ---
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "page", "establishment_id"):
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
    return [Recipes(**r) for r in (response.data or [])]


def get_recipes_by_id(id: int):
    response = supabase.table("recipes").select("*").eq("id", id).single().execute()
    return Recipes(**response.data) if response.data else None


def create_recipes(payload: dict):
    response = supabase.table("recipes").insert(payload).execute()
    return response.data[0] if response.data else None


def update_recipes(id: int, payload: dict):
    response = supabase.table("recipes").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_recipes(id: int):
    supabase.table("recipes").delete().eq("id", id).execute()
    return {"deleted": True}
