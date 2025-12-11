from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.core.supabase_client import supabase
from app.schemas.recommendations_ai import RecommendationsAi

def get_all_recommendations_ai(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("recommendations_ai").select("*")
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
    return [RecommendationsAi(**r) for r in (response.data or [])]


def get_recommendations_ai_by_id(id: UUID):
    response = supabase.table("recommendations_ai").select("*").eq("id", str(id)).single().execute()
    return RecommendationsAi(**response.data) if response.data else None


def create_recommendations_ai(payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("recommendations_ai").insert(prepared).execute()
    return response.data[0] if response.data else None


def update_recommendations_ai(id: UUID, payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("recommendations_ai").update(prepared).eq("id", str(id)).execute()
    return response.data[0] if response.data else None


def delete_recommendations_ai(id: UUID):
    supabase.table("recommendations_ai").delete().eq("id", str(id)).execute()
    return {"deleted": True}
