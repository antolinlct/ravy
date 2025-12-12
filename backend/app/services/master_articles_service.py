from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.core.supabase_client import supabase
from app.schemas.master_articles import MasterArticles

def get_all_master_articles(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("master_articles").select("*")
    if not filters:
        filters = {}

    # --- Filtres dynamiques (structurels ou contextuels) ---
    if "establishment_id" in filters:
        query = query.eq("establishment_id", filters["establishment_id"])
    if "supplier_id" in filters:
        query = query.eq("supplier_id", filters["supplier_id"])


    # --- Filtres additionnels (_gte, _lte, etc.) ---
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "page", "establishment_id", "supplier_id"):
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
    return [MasterArticles(**r) for r in (response.data or [])]


def get_master_articles_by_id(id: UUID):
    response = supabase.table("master_articles").select("*").eq("id", str(id)).single().execute()
    return MasterArticles(**response.data) if response.data else None


def create_master_articles(payload: dict):
    prepared = {k: v for k, v in payload.items() if v is not None and k != "id"}
    response = supabase.table("master_articles").insert(prepared).execute()
    return response.data[0] if response.data else None


def update_master_articles(id: UUID, payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("master_articles").update(prepared).eq("id", str(id)).execute()
    return response.data[0] if response.data else None


def delete_master_articles(id: UUID):
    supabase.table("master_articles").delete().eq("id", str(id)).execute()
    return {"deleted": True}
