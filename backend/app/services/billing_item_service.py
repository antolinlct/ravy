from app.core.supabase_client import supabase
from app.schemas.billing_item import BillingItem

def get_all_billing_item(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("billing_item").select("*")
    if not filters:
        filters = {}

    # --- Filtres dynamiques (structurels ou contextuels) ---
    # Aucun filtre structurel spécifique


    # --- Filtres additionnels (_gte, _lte, etc.) ---
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "page", ):
            continue
        if key.endswith("_gte"):
            query = query.gte(key[:-4], value)
        elif key.endswith("_lte"):
            query = query.lte(key[:-4], value)
        elif key.endswith("_like"):
            query = query.like(key[:-5], f"%{value}%")
        elif key.endswith("_neq"):
            query = query.neq(key[:-4], value)
        else:
            query = query.eq(key, value)

    # --- Tri & Pagination ---
    if "order_by" in filters:
        query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")

    start = (page - 1) * limit
    end = start + limit - 1
    query = query.range(start, end)

    response = query.execute()
    return [BillingItem(**r) for r in (response.data or [])]


def get_billing_item_by_id(id: int):
    response = supabase.table("billing_item").select("*").eq("id", id).single().execute()
    return BillingItem(**response.data) if response.data else None


def create_billing_item(payload: dict):
    response = supabase.table("billing_item").insert(payload).execute()
    return response.data[0] if response.data else None


def update_billing_item(id: int, payload: dict):
    response = supabase.table("billing_item").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_billing_item(id: int):
    supabase.table("billing_item").delete().eq("id", id).execute()
    return {"deleted": True}
