from app.core.supabase_client import supabase
from app.schemas.countries import Countries

def get_all_countries(filters: dict | None = None):
    query = supabase.table("countries").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Countries(**r) for r in (response.data or [])]

def get_countries_by_id(id: int):
    response = supabase.table("countries").select("*").eq("id", id).single().execute()
    return Countries(**response.data) if response.data else None

def create_countries(payload: dict):
    response = supabase.table("countries").insert(payload).execute()
    return response.data[0] if response.data else None

def update_countries(id: int, payload: dict):
    response = supabase.table("countries").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_countries(id: int):
    supabase.table("countries").delete().eq("id", id).execute()
    return {"deleted": True}
