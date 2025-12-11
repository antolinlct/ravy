from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.core.supabase_client import supabase
from app.schemas.user_mercuriale_access import UserMercurialeAccess

def get_all_user_mercuriale_access(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("user_mercuriale_access").select("*")
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
    return [UserMercurialeAccess(**r) for r in (response.data or [])]


def get_user_mercuriale_access_by_id(id: UUID):
    response = supabase.table("user_mercuriale_access").select("*").eq("id", str(id)).single().execute()
    return UserMercurialeAccess(**response.data) if response.data else None


def create_user_mercuriale_access(payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("user_mercuriale_access").insert(prepared).execute()
    return response.data[0] if response.data else None


def update_user_mercuriale_access(id: UUID, payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("user_mercuriale_access").update(prepared).eq("id", str(id)).execute()
    return response.data[0] if response.data else None


def delete_user_mercuriale_access(id: UUID):
    supabase.table("user_mercuriale_access").delete().eq("id", str(id)).execute()
    return {"deleted": True}
