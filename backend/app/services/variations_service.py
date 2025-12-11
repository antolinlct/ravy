from app.core.supabase_client import supabase
from app.schemas.variations import Variations

def get_all_variations(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("variations").select("*")
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
    return [Variations(**r) for r in (response.data or [])]


def get_variations_by_id(id: UUID):
    response = supabase.table("variations").select("*").eq("id", id).single().execute()
    return Variations(**response.data) if response.data else None


def create_variations(payload: dict):
    response = supabase.table("variations").insert(payload).execute()
    return response.data[0] if response.data else None


def update_variations(id: UUID, payload: dict):
    response = supabase.table("variations").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_variations(id: UUID):
    supabase.table("variations").delete().eq("id", id).execute()
    return {"deleted": True}
