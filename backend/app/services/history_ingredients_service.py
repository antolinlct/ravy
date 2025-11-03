from app.core.supabase_client import supabase
from app.schemas.history_ingredients import HistoryIngredients

def get_all_history_ingredients(filters: dict | None = None):
    query = supabase.table("history_ingredients").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [HistoryIngredients(**r) for r in (response.data or [])]

def get_history_ingredients_by_id(id: int):
    response = supabase.table("history_ingredients").select("*").eq("id", id).single().execute()
    return HistoryIngredients(**response.data) if response.data else None

def create_history_ingredients(payload: dict):
    response = supabase.table("history_ingredients").insert(payload).execute()
    return response.data[0] if response.data else None

def update_history_ingredients(id: int, payload: dict):
    response = supabase.table("history_ingredients").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_history_ingredients(id: int):
    supabase.table("history_ingredients").delete().eq("id", id).execute()
    return {"deleted": True}
