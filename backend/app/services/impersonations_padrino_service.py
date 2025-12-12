from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.core.supabase_client import supabase
from app.schemas.impersonations_padrino import ImpersonationsPadrino

def get_all_impersonations_padrino(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("impersonations_padrino").select("*")
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
    return [ImpersonationsPadrino(**r) for r in (response.data or [])]


def get_impersonations_padrino_by_id(id: UUID):
    response = supabase.table("impersonations_padrino").select("*").eq("id", str(id)).single().execute()
    return ImpersonationsPadrino(**response.data) if response.data else None


def create_impersonations_padrino(payload: dict):
    prepared = {k: v for k, v in payload.items() if v is not None and k != "id"}
    response = supabase.table("impersonations_padrino").insert(prepared).execute()
    return response.data[0] if response.data else None


def update_impersonations_padrino(id: UUID, payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("impersonations_padrino").update(prepared).eq("id", str(id)).execute()
    return response.data[0] if response.data else None


def delete_impersonations_padrino(id: UUID):
    supabase.table("impersonations_padrino").delete().eq("id", str(id)).execute()
    return {"deleted": True}
