from app.core.supabase_client import supabase
from app.schemas.subscriptions import Subscriptions

def get_all_subscriptions(filters: dict | None = None):
    query = supabase.table("subscriptions").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Subscriptions(**r) for r in (response.data or [])]

def get_subscriptions_by_id(id: int):
    response = supabase.table("subscriptions").select("*").eq("id", id).single().execute()
    return Subscriptions(**response.data) if response.data else None

def create_subscriptions(payload: dict):
    response = supabase.table("subscriptions").insert(payload).execute()
    return response.data[0] if response.data else None

def update_subscriptions(id: int, payload: dict):
    response = supabase.table("subscriptions").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_subscriptions(id: int):
    supabase.table("subscriptions").delete().eq("id", id).execute()
    return {"deleted": True}
