from app.core.supabase_client import supabase
from app.schemas.establishment_settings import EstablishmentSettings

def get_all_establishment_settings(filters: dict | None = None):
    query = supabase.table("establishment_settings").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [EstablishmentSettings(**r) for r in (response.data or [])]

def get_establishment_settings_by_id(id: int):
    response = supabase.table("establishment_settings").select("*").eq("id", id).single().execute()
    return EstablishmentSettings(**response.data) if response.data else None

def create_establishment_settings(payload: dict):
    response = supabase.table("establishment_settings").insert(payload).execute()
    return response.data[0] if response.data else None

def update_establishment_settings(id: int, payload: dict):
    response = supabase.table("establishment_settings").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_establishment_settings(id: int):
    supabase.table("establishment_settings").delete().eq("id", id).execute()
    return {"deleted": True}
