from app.core.supabase_client import supabase
from app.schemas.supplier_alias import SupplierAlias

def get_all_supplier_alias(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("supplier_alias").select("*")
    if not filters:
        filters = {}

    # --- Filtres dynamiques (structurels ou contextuels) ---
    if "establishment_id" in filters:
        query = query.eq("establishment_id", filters["establishment_id"])


    # --- Filtres additionnels (_gte, _lte, etc.) ---
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "page", "establishment_id"):
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
    return [SupplierAlias(**r) for r in (response.data or [])]


def get_supplier_alias_by_id(id: int):
    response = supabase.table("supplier_alias").select("*").eq("id", id).single().execute()
    return SupplierAlias(**response.data) if response.data else None


def create_supplier_alias(payload: dict):
    response = supabase.table("supplier_alias").insert(payload).execute()
    return response.data[0] if response.data else None


def update_supplier_alias(id: int, payload: dict):
    response = supabase.table("supplier_alias").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_supplier_alias(id: int):
    supabase.table("supplier_alias").delete().eq("id", id).execute()
    return {"deleted": True}
