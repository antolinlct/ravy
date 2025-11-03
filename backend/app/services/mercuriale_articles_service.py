from app.core.supabase_client import supabase
from app.schemas.mercuriale_articles import MercurialeArticles

def get_all_mercuriale_articles(filters: dict | None = None):
    query = supabase.table("mercuriale_articles").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [MercurialeArticles(**r) for r in (response.data or [])]

def get_mercuriale_articles_by_id(id: int):
    response = supabase.table("mercuriale_articles").select("*").eq("id", id).single().execute()
    return MercurialeArticles(**response.data) if response.data else None

def create_mercuriale_articles(payload: dict):
    response = supabase.table("mercuriale_articles").insert(payload).execute()
    return response.data[0] if response.data else None

def update_mercuriale_articles(id: int, payload: dict):
    response = supabase.table("mercuriale_articles").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_mercuriale_articles(id: int):
    supabase.table("mercuriale_articles").delete().eq("id", id).execute()
    return {"deleted": True}
