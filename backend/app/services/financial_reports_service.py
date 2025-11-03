from app.core.supabase_client import supabase
from app.schemas.financial_reports import FinancialReports

def get_all_financial_reports(filters: dict | None = None):
    query = supabase.table("financial_reports").select("*")
    if filters:
        for key, value in filters.items():
            if key in ("order_by", "direction"):
                continue
            query = query.eq(key, value)
        if "order_by" in filters:
            query = query.order(filters["order_by"], desc=filters.get("direction") == "desc")
    response = query.execute()
    return [FinancialReports(**r) for r in (response.data or [])]

def get_financial_reports_by_id(id: int):
    response = supabase.table("financial_reports").select("*").eq("id", id).single().execute()
    return FinancialReports(**response.data) if response.data else None

def create_financial_reports(payload: dict):
    response = supabase.table("financial_reports").insert(payload).execute()
    return response.data[0] if response.data else None

def update_financial_reports(id: int, payload: dict):
    response = supabase.table("financial_reports").update(payload).eq("id", id).execute()
    return response.data[0] if response.data else None

def delete_financial_reports(id: int):
    supabase.table("financial_reports").delete().eq("id", id).execute()
    return {"deleted": True}
