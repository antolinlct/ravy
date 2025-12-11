from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.invoices import Invoices
from app.services import invoices_service

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("/", response_model=list[Invoices])
def list_invoices(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None,
    supplier_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id, "supplier_id": supplier_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return invoices_service.get_all_invoices(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Invoices)
def get_invoices(id: UUID):
    item = invoices_service.get_invoices_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Invoices not found")
    return item

@router.post("/", response_model=Invoices)
def create_invoices(data: Invoices):
    created = invoices_service.create_invoices(data.dict())
    return Invoices(**created)

@router.patch("/{id}", response_model=Invoices)
def update_invoices(id: int, data: Invoices):
    updated = invoices_service.update_invoices(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Invoices not found")
    return Invoices(**updated)

@router.delete("/{id}")
def delete_invoices(id: UUID):
    invoices_service.delete_invoices(id)
    return {"deleted": True}
