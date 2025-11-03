from app.core.supabase_client import supabase
from app.schemas.billing_accounts import BillingAccounts

def get_all_billing_accounts(filters: dict | None = None):
    query = supabase.table("billing_accounts").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [BillingAccounts(**r) for r in (response.data or [])]

def get_billing_accounts_by_id(id: int):
    response = supabase.table("billing_accounts").select("*").eq("id", id).single().execute()
    return BillingAccounts(**response.data) if response.data else None

def create_billing_accounts(payload: dict):
    response = supabase.table("billing_accounts").insert(payload).execute()
    return response.data[0] if response.data else None

def update_billing_accounts(id: int, payload: dict):
    response = supabase.table("billing_accounts").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_billing_accounts(id: int):
    supabase.table("billing_accounts").delete().eq("id", id).execute()
    return {"deleted": True}
