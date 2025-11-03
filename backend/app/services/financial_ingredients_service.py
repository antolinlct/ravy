from app.core.supabase_client import supabase
from app.schemas.financial_ingredients import FinancialIngredients

def get_all_financial_ingredients(filters: dict | None = None):
    query = supabase.table("financial_ingredients").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [FinancialIngredients(**r) for r in (response.data or [])]

def get_financial_ingredients_by_id(id: int):
    response = supabase.table("financial_ingredients").select("*").eq("id", id).single().execute()
    return FinancialIngredients(**response.data) if response.data else None

def create_financial_ingredients(payload: dict):
    response = supabase.table("financial_ingredients").insert(payload).execute()
    return response.data[0] if response.data else None

def update_financial_ingredients(id: int, payload: dict):
    response = supabase.table("financial_ingredients").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_financial_ingredients(id: int):
    supabase.table("financial_ingredients").delete().eq("id", id).execute()
    return {"deleted": True}
