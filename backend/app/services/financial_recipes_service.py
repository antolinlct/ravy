from app.core.supabase_client import supabase
from app.schemas.financial_recipes import FinancialRecipes

def get_all_financial_recipes(filters: dict | None = None):
    query = supabase.table("financial_recipes").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [FinancialRecipes(**r) for r in (response.data or [])]

def get_financial_recipes_by_id(id: int):
    response = supabase.table("financial_recipes").select("*").eq("id", id).single().execute()
    return FinancialRecipes(**response.data) if response.data else None

def create_financial_recipes(payload: dict):
    response = supabase.table("financial_recipes").insert(payload).execute()
    return response.data[0] if response.data else None

def update_financial_recipes(id: int, payload: dict):
    response = supabase.table("financial_recipes").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_financial_recipes(id: int):
    supabase.table("financial_recipes").delete().eq("id", id).execute()
    return {"deleted": True}
