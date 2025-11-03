from app.core.supabase_client import supabase
from app.schemas.user_establishment import UserEstablishment

def get_all_user_establishment(filters: dict | None = None):
    query = supabase.table("user_establishment").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [UserEstablishment(**r) for r in (response.data or [])]

def get_user_establishment_by_id(id: int):
    response = supabase.table("user_establishment").select("*").eq("id", id).single().execute()
    return UserEstablishment(**response.data) if response.data else None

def create_user_establishment(payload: dict):
    response = supabase.table("user_establishment").insert(payload).execute()
    return response.data[0] if response.data else None

def update_user_establishment(id: int, payload: dict):
    response = supabase.table("user_establishment").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_user_establishment(id: int):
    supabase.table("user_establishment").delete().eq("id", id).execute()
    return {"deleted": True}
