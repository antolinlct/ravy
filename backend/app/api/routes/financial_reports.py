from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.financial_reports import FinancialReports
from app.services import financial_reports_service

router = APIRouter(prefix="/financial_reports", tags=["FinancialReports"])

@router.get("/", response_model=list[FinancialReports])
def list_financial_reports(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return financial_reports_service.get_all_financial_reports(filters, limit=limit, page=page)

@router.get("/{id}", response_model=FinancialReports)
def get_financial_reports(id: UUID):
    item = financial_reports_service.get_financial_reports_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="FinancialReports not found")
    return item

@router.post("/", response_model=FinancialReports)
def create_financial_reports(data: FinancialReports):
    created = financial_reports_service.create_financial_reports(data.dict())
    return FinancialReports(**created)

@router.patch("/{id}", response_model=FinancialReports)
def update_financial_reports(id: int, data: FinancialReports):
    updated = financial_reports_service.update_financial_reports(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="FinancialReports not found")
    return FinancialReports(**updated)

@router.delete("/{id}")
def delete_financial_reports(id: UUID):
    financial_reports_service.delete_financial_reports(id)
    return {"deleted": True}
