from app.core.supabase_client import supabase
from app.schemas.establishment_email_alias import EstablishmentEmailAlias

def get_all_establishment_email_alias(filters: dict | None = None):
    query = supabase.table("establishment_email_alias").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [EstablishmentEmailAlias(**r) for r in (response.data or [])]

def get_establishment_email_alias_by_id(id: int):
    response = supabase.table("establishment_email_alias").select("*").eq("id", id).single().execute()
    return EstablishmentEmailAlias(**response.data) if response.data else None

def create_establishment_email_alias(payload: dict):
    response = supabase.table("establishment_email_alias").insert(payload).execute()
    return response.data[0] if response.data else None

def update_establishment_email_alias(id: int, payload: dict):
    response = supabase.table("establishment_email_alias").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_establishment_email_alias(id: int):
    supabase.table("establishment_email_alias").delete().eq("id", id).execute()
    return {"deleted": True}
