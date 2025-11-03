from app.core.supabase_client import supabase
from app.schemas.articles import Articles

def get_all_articles(filters: dict | None = None):
    query = supabase.table("articles").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [Articles(**r) for r in (response.data or [])]

def get_articles_by_id(id: int):
    response = supabase.table("articles").select("*").eq("id", id).single().execute()
    return Articles(**response.data) if response.data else None

def create_articles(payload: dict):
    response = supabase.table("articles").insert(payload).execute()
    return response.data[0] if response.data else None

def update_articles(id: int, payload: dict):
    response = supabase.table("articles").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_articles(id: int):
    supabase.table("articles").delete().eq("id", id).execute()
    return {"deleted": True}
