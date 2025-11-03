from app.core.supabase_client import supabase
from app.schemas.recommendations import Recommendations

def get_all_recommendations(filters: dict | None = None):
    query = supabase.table("recommendations").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Recommendations(**r) for r in (response.data or [])]

def get_recommendations_by_id(id: int):
    response = supabase.table("recommendations").select("*").eq("id", id).single().execute()
    return Recommendations(**response.data) if response.data else None

def create_recommendations(payload: dict):
    response = supabase.table("recommendations").insert(payload).execute()
    return response.data[0] if response.data else None

def update_recommendations(id: int, payload: dict):
    response = supabase.table("recommendations").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_recommendations(id: int):
    supabase.table("recommendations").delete().eq("id", id).execute()
    return {"deleted": True}
