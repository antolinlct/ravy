from app.core.supabase_client import supabase
from app.schemas.subscription_applied_features import SubscriptionAppliedFeatures

def get_all_subscription_applied_features(filters: dict | None = None):
    query = supabase.table("subscription_applied_features").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [SubscriptionAppliedFeatures(**r) for r in (response.data or [])]

def get_subscription_applied_features_by_id(id: int):
    response = supabase.table("subscription_applied_features").select("*").eq("id", id).single().execute()
    return SubscriptionAppliedFeatures(**response.data) if response.data else None

def create_subscription_applied_features(payload: dict):
    response = supabase.table("subscription_applied_features").insert(payload).execute()
    return response.data[0] if response.data else None

def update_subscription_applied_features(id: int, payload: dict):
    response = supabase.table("subscription_applied_features").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_subscription_applied_features(id: int):
    supabase.table("subscription_applied_features").delete().eq("id", id).execute()
    return {"deleted": True}
