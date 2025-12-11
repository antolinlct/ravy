from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.core.supabase_client import supabase
from app.schemas.price_stripe import PriceStripe

def get_all_price_stripe(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("price_stripe").select("*")
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
    return [PriceStripe(**r) for r in (response.data or [])]


def get_price_stripe_by_id(id: UUID):
    response = supabase.table("price_stripe").select("*").eq("id", str(id)).single().execute()
    return PriceStripe(**response.data) if response.data else None


def create_price_stripe(payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("price_stripe").insert(prepared).execute()
    return response.data[0] if response.data else None


def update_price_stripe(id: UUID, payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("price_stripe").update(prepared).eq("id", str(id)).execute()
    return response.data[0] if response.data else None


def delete_price_stripe(id: UUID):
    supabase.table("price_stripe").delete().eq("id", str(id)).execute()
    return {"deleted": True}
