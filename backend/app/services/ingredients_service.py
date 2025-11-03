from app.core.supabase_client import supabase
from app.schemas.ingredients import Ingredients

def get_all_ingredients(filters: dict | None = None):
    query = supabase.table("ingredients").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Ingredients(**r) for r in (response.data or [])]

def get_ingredients_by_id(id: int):
    response = supabase.table("ingredients").select("*").eq("id", id).single().execute()
    return Ingredients(**response.data) if response.data else None

def create_ingredients(payload: dict):
    response = supabase.table("ingredients").insert(payload).execute()
    return response.data[0] if response.data else None

def update_ingredients(id: int, payload: dict):
    response = supabase.table("ingredients").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_ingredients(id: int):
    supabase.table("ingredients").delete().eq("id", id).execute()
    return {"deleted": True}
