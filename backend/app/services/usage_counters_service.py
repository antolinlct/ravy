from app.core.supabase_client import supabase
from app.schemas.usage_counters import UsageCounters

def get_all_usage_counters(filters: dict | None = None):
    query = supabase.table("usage_counters").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [UsageCounters(**r) for r in (response.data or [])]

def get_usage_counters_by_id(id: int):
    response = supabase.table("usage_counters").select("*").eq("id", id).single().execute()
    return UsageCounters(**response.data) if response.data else None

def create_usage_counters(payload: dict):
    response = supabase.table("usage_counters").insert(payload).execute()
    return response.data[0] if response.data else None

def update_usage_counters(id: int, payload: dict):
    response = supabase.table("usage_counters").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_usage_counters(id: int):
    supabase.table("usage_counters").delete().eq("id", id).execute()
    return {"deleted": True}
