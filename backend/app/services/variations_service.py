from app.core.supabase_client import supabase
from app.schemas.variations import Variations

def get_all_variations(filters: dict | None = None):
    query = supabase.table("variations").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Variations(**r) for r in (response.data or [])]

def get_variations_by_id(id: int):
    response = supabase.table("variations").select("*").eq("id", id).single().execute()
    return Variations(**response.data) if response.data else None

def create_variations(payload: dict):
    response = supabase.table("variations").insert(payload).execute()
    return response.data[0] if response.data else None

def update_variations(id: int, payload: dict):
    response = supabase.table("variations").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_variations(id: int):
    supabase.table("variations").delete().eq("id", id).execute()
    return {"deleted": True}
