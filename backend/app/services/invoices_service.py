from app.core.supabase_client import supabase
from app.schemas.invoices import Invoices

def get_all_invoices(filters: dict | None = None):
    query = supabase.table("invoices").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Invoices(**r) for r in (response.data or [])]

def get_invoices_by_id(id: int):
    response = supabase.table("invoices").select("*").eq("id", id).single().execute()
    return Invoices(**response.data) if response.data else None

def create_invoices(payload: dict):
    response = supabase.table("invoices").insert(payload).execute()
    return response.data[0] if response.data else None

def update_invoices(id: int, payload: dict):
    response = supabase.table("invoices").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_invoices(id: int):
    supabase.table("invoices").delete().eq("id", id).execute()
    return {"deleted": True}
