from app.core.supabase_client import supabase
from app.schemas.users import Users

def get_all_users(filters: dict | None = None):
    query = supabase.table("users").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Users(**r) for r in (response.data or [])]

def get_users_by_id(id: int):
    response = supabase.table("users").select("*").eq("id", id).single().execute()
    return Users(**response.data) if response.data else None

def create_users(payload: dict):
    response = supabase.table("users").insert(payload).execute()
    return response.data[0] if response.data else None

def update_users(id: int, payload: dict):
    response = supabase.table("users").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_users(id: int):
    supabase.table("users").delete().eq("id", id).execute()
    return {"deleted": True}
