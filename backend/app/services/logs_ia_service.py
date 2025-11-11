from app.core.supabase_client import supabase
from app.schemas.logs_ia import LogsIa

def get_all_logs_ia(filters: dict | None = None):
    query = supabase.table("logs_ia").select("*")
    if not filters:
        filters = {}

    # --- 1️⃣ Filtres structurels
    if "establishment_id" in filters:
        query = query.eq("establishment_id", filters["establishment_id"])
    if "supplier_id" in filters:
        query = query.eq("supplier_id", filters["supplier_id"])

    # --- 2️⃣ Filtres dynamiques
    for key, value in filters.items():
        if key in ("order_by", "direction", "limit", "establishment_id", "supplier_id"):
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

    # --- 3️⃣ Tri et limite
    if "order_by" in filters:
        query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    if "limit" in filters:
        try:
            query = query.limit(int(filters["limit"]))
        except ValueError:
            pass

    response = query.execute()
    return [LogsIa(**r) for r in (response.data or [])]


def get_logs_ia_by_id(id: int):
    response = supabase.table("logs_ia").select("*").eq("id", id).single().execute()
    return LogsIa(**response.data) if response.data else None


def create_logs_ia(payload: dict):
    response = supabase.table("logs_ia").insert(payload).execute()
    return response.data[0] if response.data else None


def update_logs_ia(id: int, payload: dict):
    response = supabase.table("logs_ia").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_logs_ia(id: int):
    supabase.table("logs_ia").delete().eq("id", id).execute()
    return {"deleted": True}
