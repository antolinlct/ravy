from app.core.supabase_client import supabase
from app.schemas.establishments import Establishments

def get_all_establishments(filters: dict | None = None):
    query = supabase.table("establishments").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Establishments(**r) for r in (response.data or [])]

def get_establishments_by_id(id: int):
    response = supabase.table("establishments").select("*").eq("id", id).single().execute()
    return Establishments(**response.data) if response.data else None

def create_establishments(payload: dict):
    response = supabase.table("establishments").insert(payload).execute()
    return response.data[0] if response.data else None

def update_establishments(id: int, payload: dict):
    response = supabase.table("establishments").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_establishments(id: int):
    supabase.table("establishments").delete().eq("id", id).execute()
    return {"deleted": True}
