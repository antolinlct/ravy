from app.core.supabase_client import supabase
from app.schemas.vat_rates import VatRates

def get_all_vat_rates(filters: dict | None = None):
    query = supabase.table("vat_rates").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [VatRates(**r) for r in (response.data or [])]

def get_vat_rates_by_id(id: int):
    response = supabase.table("vat_rates").select("*").eq("id", id).single().execute()
    return VatRates(**response.data) if response.data else None

def create_vat_rates(payload: dict):
    response = supabase.table("vat_rates").insert(payload).execute()
    return response.data[0] if response.data else None

def update_vat_rates(id: int, payload: dict):
    response = supabase.table("vat_rates").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_vat_rates(id: int):
    supabase.table("vat_rates").delete().eq("id", id).execute()
    return {"deleted": True}
