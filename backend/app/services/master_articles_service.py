from app.core.supabase_client import supabase
from app.schemas.master_articles import MasterArticles

def get_all_master_articles(filters: dict | None = None):
    query = supabase.table("master_articles").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [MasterArticles(**r) for r in (response.data or [])]

def get_master_articles_by_id(id: int):
    response = supabase.table("master_articles").select("*").eq("id", id).single().execute()
    return MasterArticles(**response.data) if response.data else None

def create_master_articles(payload: dict):
    response = supabase.table("master_articles").insert(payload).execute()
    return response.data[0] if response.data else None

def update_master_articles(id: int, payload: dict):
    response = supabase.table("master_articles").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_master_articles(id: int):
    supabase.table("master_articles").delete().eq("id", id).execute()
    return {"deleted": True}
