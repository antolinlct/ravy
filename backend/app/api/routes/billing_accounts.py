from fastapi import APIRouter, HTTPException
from app.schemas.billing_accounts import BillingAccounts
from app.services import billing_accounts_service

router = APIRouter(prefix="/billing_accounts", tags=["BillingAccounts"])

@router.get("/", response_model=list[BillingAccounts])
def list_billing_accounts(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return billing_accounts_service.get_all_billing_accounts(filters)

@router.get("/{id}", response_model=BillingAccounts)
def get_billing_accounts(id: int):
    item = billing_accounts_service.get_billing_accounts_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="BillingAccounts not found")
    return item

@router.post("/", response_model=BillingAccounts)
def create_billing_accounts(data: BillingAccounts):
    created = billing_accounts_service.create_billing_accounts(data.dict())
    return BillingAccounts(**created)

@router.patch("/{id}", response_model=BillingAccounts)
def update_billing_accounts(id: int, data: BillingAccounts):
    updated = billing_accounts_service.update_billing_accounts(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="BillingAccounts not found")
    return BillingAccounts(**updated)

@router.delete("/{id}")
def delete_billing_accounts(id: int):
    billing_accounts_service.delete_billing_accounts(id)
    return {"deleted": True}
