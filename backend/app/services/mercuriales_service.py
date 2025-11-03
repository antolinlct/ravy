from app.core.supabase_client import supabase
from app.schemas.mercuriales import Mercuriales

def get_all_mercuriales(filters: dict | None = None):
    query = supabase.table("mercuriales").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Mercuriales(**r) for r in (response.data or [])]

def get_mercuriales_by_id(id: int):
    response = supabase.table("mercuriales").select("*").eq("id", id).single().execute()
    return Mercuriales(**response.data) if response.data else None

def create_mercuriales(payload: dict):
    response = supabase.table("mercuriales").insert(payload).execute()
    return response.data[0] if response.data else None

def update_mercuriales(id: int, payload: dict):
    response = supabase.table("mercuriales").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_mercuriales(id: int):
    supabase.table("mercuriales").delete().eq("id", id).execute()
    return {"deleted": True}
