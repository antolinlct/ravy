from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.billing_account import BillingAccount
from app.services import billing_account_service

router = APIRouter(prefix="/billing_account", tags=["BillingAccount"])

@router.get("/", response_model=list[BillingAccount])
def list_billing_account(
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
    return billing_account_service.get_all_billing_account(filters, limit=limit, page=page)

@router.get("/{id}", response_model=BillingAccount)
def get_billing_account(id: UUID):
    item = billing_account_service.get_billing_account_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="BillingAccount not found")
    return item

@router.post("/", response_model=BillingAccount)
def create_billing_account(data: BillingAccount):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = billing_account_service.create_billing_account(payload)
    return BillingAccount(**created)

@router.patch("/{id}", response_model=BillingAccount)
def update_billing_account(id: UUID, data: BillingAccount):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = billing_account_service.update_billing_account(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="BillingAccount not found")
    return BillingAccount(**updated)

@router.delete("/{id}")
def delete_billing_account(id: UUID):
    billing_account_service.delete_billing_account(id)
    return {"deleted": True}
