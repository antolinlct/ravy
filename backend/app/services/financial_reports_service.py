from uuid import UUID

from fastapi.encoders import jsonable_encoder

from app.core.supabase_client import supabase
from app.schemas.financial_reports import FinancialReports

def get_all_financial_reports(filters: dict | None = None, limit: int = 200, page: int = 1):
    query = supabase.table("financial_reports").select("*")
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
    return [FinancialReports(**r) for r in (response.data or [])]


def get_financial_reports_by_id(id: UUID):
    response = supabase.table("financial_reports").select("*").eq("id", str(id)).single().execute()
    return FinancialReports(**response.data) if response.data else None


def create_financial_reports(payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("financial_reports").insert(prepared).execute()
    return response.data[0] if response.data else None


def update_financial_reports(id: UUID, payload: dict):
    prepared = jsonable_encoder(payload)
    response = supabase.table("financial_reports").update(prepared).eq("id", str(id)).execute()
    return response.data[0] if response.data else None


def delete_financial_reports(id: UUID):
    supabase.table("financial_reports").delete().eq("id", str(id)).execute()
    return {"deleted": True}
