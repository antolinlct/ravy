from app.core.supabase_client import supabase
from app.schemas.user_mercuriale_access import UserMercurialeAccess

def get_all_user_mercuriale_access(filters: dict | None = None):
    query = supabase.table("user_mercuriale_access").select("*")
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
    return [UserMercurialeAccess(**r) for r in (response.data or [])]


def get_user_mercuriale_access_by_id(id: int):
    response = supabase.table("user_mercuriale_access").select("*").eq("id", id).single().execute()
    return UserMercurialeAccess(**response.data) if response.data else None


def create_user_mercuriale_access(payload: dict):
    response = supabase.table("user_mercuriale_access").insert(payload).execute()
    return response.data[0] if response.data else None


def update_user_mercuriale_access(id: int, payload: dict):
    response = supabase.table("user_mercuriale_access").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None


def delete_user_mercuriale_access(id: int):
    supabase.table("user_mercuriale_access").delete().eq("id", id).execute()
    return {"deleted": True}
