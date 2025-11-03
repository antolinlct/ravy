from app.core.supabase_client import supabase
from app.schemas.alerts import Alerts

def get_all_alerts(filters: dict | None = None):
    query = supabase.table("alerts").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Alerts(**r) for r in (response.data or [])]

def get_alerts_by_id(id: int):
    response = supabase.table("alerts").select("*").eq("id", id).single().execute()
    return Alerts(**response.data) if response.data else None

def create_alerts(payload: dict):
    response = supabase.table("alerts").insert(payload).execute()
    return response.data[0] if response.data else None

def update_alerts(id: int, payload: dict):
    response = supabase.table("alerts").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_alerts(id: int):
    supabase.table("alerts").delete().eq("id", id).execute()
    return {"deleted": True}
