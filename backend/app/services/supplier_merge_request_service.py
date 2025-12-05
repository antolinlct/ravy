from app.core.supabase_client import supabase
from app.schemas.supplier_merge_request import SupplierMergeRequest

def get_all_supplier_merge_request(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("supplier_merge_request").select("*")
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
    return [SupplierMergeRequest(**r) for r in (response.data or [])]


def get_supplier_merge_request_by_id(id: int):
    response = supabase.table("supplier_merge_request").select("*").eq("id", id).single().execute()
    return SupplierMergeRequest(**response.data) if response.data else None


def create_supplier_merge_request(payload: dict):
    response = supabase.table("supplier_merge_request").insert(payload).execute()
    return response.data[0] if response.data else None


def update_supplier_merge_request(id: int, payload: dict):
    response = supabase.table("supplier_merge_request").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_supplier_merge_request(id: int):
    supabase.table("supplier_merge_request").delete().eq("id", id).execute()
    return {"deleted": True}
