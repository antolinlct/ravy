from app.core.supabase_client import supabase
from app.schemas.recipes import Recipes

def get_all_recipes(filters: dict | None = None):
    query = supabase.table("recipes").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
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
