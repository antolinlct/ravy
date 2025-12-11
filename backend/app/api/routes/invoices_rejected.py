from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.invoices_rejected import InvoicesRejected
from app.services import invoices_rejected_service

router = APIRouter(prefix="/invoices_rejected", tags=["InvoicesRejected"])

@router.get("/", response_model=list[InvoicesRejected])
def list_invoices_rejected(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return invoices_rejected_service.get_all_invoices_rejected(filters, limit=limit, page=page)

@router.get("/{id}", response_model=InvoicesRejected)
def get_invoices_rejected(id: UUID):
    item = invoices_rejected_service.get_invoices_rejected_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="InvoicesRejected not found")
    return item

@router.post("/", response_model=InvoicesRejected)
def create_invoices_rejected(data: InvoicesRejected):
    payload = jsonable_encoder(data.dict())
    created = invoices_rejected_service.create_invoices_rejected(payload)
    return InvoicesRejected(**created)

@router.patch("/{id}", response_model=InvoicesRejected)
def update_invoices_rejected(id: UUID, data: InvoicesRejected):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = invoices_rejected_service.update_invoices_rejected(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="InvoicesRejected not found")
    return InvoicesRejected(**updated)

@router.delete("/{id}")
def delete_invoices_rejected(id: UUID):
    invoices_rejected_service.delete_invoices_rejected(id)
    return {"deleted": True}
