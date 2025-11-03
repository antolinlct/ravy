from app.core.supabase_client import supabase
from app.schemas.impersonations import Impersonations

def get_all_impersonations(filters: dict | None = None):
    query = supabase.table("impersonations").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Impersonations(**r) for r in (response.data or [])]

def get_impersonations_by_id(id: int):
    response = supabase.table("impersonations").select("*").eq("id", id).single().execute()
    return Impersonations(**response.data) if response.data else None

def create_impersonations(payload: dict):
    response = supabase.table("impersonations").insert(payload).execute()
    return response.data[0] if response.data else None

def update_impersonations(id: int, payload: dict):
    response = supabase.table("impersonations").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_impersonations(id: int):
    supabase.table("impersonations").delete().eq("id", id).execute()
    return {"deleted": True}
