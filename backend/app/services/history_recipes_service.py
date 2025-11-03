from app.core.supabase_client import supabase
from app.schemas.history_recipes import HistoryRecipes

def get_all_history_recipes(filters: dict | None = None):
    query = supabase.table("history_recipes").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [HistoryRecipes(**r) for r in (response.data or [])]

def get_history_recipes_by_id(id: int):
    response = supabase.table("history_recipes").select("*").eq("id", id).single().execute()
    return HistoryRecipes(**response.data) if response.data else None

def create_history_recipes(payload: dict):
    response = supabase.table("history_recipes").insert(payload).execute()
    return response.data[0] if response.data else None

def update_history_recipes(id: int, payload: dict):
    response = supabase.table("history_recipes").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_history_recipes(id: int):
    supabase.table("history_recipes").delete().eq("id", id).execute()
    return {"deleted": True}
