from app.core.supabase_client import supabase
from app.schemas.plan_features import PlanFeatures

def get_all_plan_features(filters: dict | None = None):
    query = supabase.table("plan_features").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [PlanFeatures(**r) for r in (response.data or [])]

def get_plan_features_by_id(id: int):
    response = supabase.table("plan_features").select("*").eq("id", id).single().execute()
    return PlanFeatures(**response.data) if response.data else None

def create_plan_features(payload: dict):
    response = supabase.table("plan_features").insert(payload).execute()
    return response.data[0] if response.data else None

def update_plan_features(id: int, payload: dict):
    response = supabase.table("plan_features").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_plan_features(id: int):
    supabase.table("plan_features").delete().eq("id", id).execute()
    return {"deleted": True}
