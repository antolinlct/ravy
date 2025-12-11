from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.billing_item import BillingItem
from app.services import billing_item_service

router = APIRouter(prefix="/billing_item", tags=["BillingItem"])

@router.get("/", response_model=list[BillingItem])
def list_billing_item(
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
    return billing_item_service.get_all_billing_item(filters, limit=limit, page=page)

@router.get("/{id}", response_model=BillingItem)
def get_billing_item(id: UUID):
    item = billing_item_service.get_billing_item_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="BillingItem not found")
    return item

@router.post("/", response_model=BillingItem)
def create_billing_item(data: BillingItem):
    payload = jsonable_encoder(data.dict())
    created = billing_item_service.create_billing_item(payload)
    return BillingItem(**created)

@router.patch("/{id}", response_model=BillingItem)
def update_billing_item(id: UUID, data: BillingItem):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = billing_item_service.update_billing_item(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="BillingItem not found")
    return BillingItem(**updated)

@router.delete("/{id}")
def delete_billing_item(id: UUID):
    billing_item_service.delete_billing_item(id)
    return {"deleted": True}
