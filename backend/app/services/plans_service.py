from app.core.supabase_client import supabase
from app.schemas.plans import Plans

def get_all_plans(filters: dict | None = None):
    query = supabase.table("plans").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Plans(**r) for r in (response.data or [])]

def get_plans_by_id(id: int):
    response = supabase.table("plans").select("*").eq("id", id).single().execute()
    return Plans(**response.data) if response.data else None

def create_plans(payload: dict):
    response = supabase.table("plans").insert(payload).execute()
    return response.data[0] if response.data else None

def update_plans(id: int, payload: dict):
    response = supabase.table("plans").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_plans(id: int):
    supabase.table("plans").delete().eq("id", id).execute()
    return {"deleted": True}
