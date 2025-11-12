from app.core.supabase_client import supabase
from app.schemas.market_articles import MarketArticles

def get_all_market_articles(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("market_articles").select("*")
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
    return [MarketArticles(**r) for r in (response.data or [])]


def get_market_articles_by_id(id: int):
    response = supabase.table("market_articles").select("*").eq("id", id).single().execute()
    return MarketArticles(**response.data) if response.data else None


def create_market_articles(payload: dict):
    response = supabase.table("market_articles").insert(payload).execute()
    return response.data[0] if response.data else None


def update_market_articles(id: int, payload: dict):
    response = supabase.table("market_articles").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_market_articles(id: int):
    supabase.table("market_articles").delete().eq("id", id).execute()
    return {"deleted": True}
