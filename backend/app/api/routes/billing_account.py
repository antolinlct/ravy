from fastapi import APIRouter, HTTPException
from app.schemas.billing_account import BillingAccount
from app.services import billing_account_service

router = APIRouter(prefix="/billing_account", tags=["BillingAccount"])

@router.get("/", response_model=list[BillingAccount])
def list_billing_account(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = 200,
    page: int | None = 1,
    establishment_id: str | None = None
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
def get_billing_account(id: int):
    item = billing_account_service.get_billing_account_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="BillingAccount not found")
    return item

@router.post("/", response_model=BillingAccount)
def create_billing_account(data: BillingAccount):
    created = billing_account_service.create_billing_account(data.dict())
    return BillingAccount(**created)

@router.patch("/{id}", response_model=BillingAccount)
def update_billing_account(id: int, data: BillingAccount):
    updated = billing_account_service.update_billing_account(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="BillingAccount not found")
    return BillingAccount(**updated)

@router.delete("/{id}")
def delete_billing_account(id: int):
    billing_account_service.delete_billing_account(id)
    return {"deleted": True}
