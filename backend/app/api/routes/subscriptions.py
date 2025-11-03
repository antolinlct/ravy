from fastapi import APIRouter, HTTPException
from app.schemas.subscriptions import Subscriptions
from app.services import subscriptions_service

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])

@router.get("/", response_model=list[Subscriptions])
def list_subscriptions(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return subscriptions_service.get_all_subscriptions(filters)

@router.get("/{id}", response_model=Subscriptions)
def get_subscriptions(id: int):
    item = subscriptions_service.get_subscriptions_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Subscriptions not found")
    return item

@router.post("/", response_model=Subscriptions)
def create_subscriptions(data: Subscriptions):
    created = subscriptions_service.create_subscriptions(data.dict())
    return Subscriptions(**created)

@router.patch("/{id}", response_model=Subscriptions)
def update_subscriptions(id: int, data: Subscriptions):
    updated = subscriptions_service.update_subscriptions(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Subscriptions not found")
    return Subscriptions(**updated)

@router.delete("/{id}")
def delete_subscriptions(id: int):
    subscriptions_service.delete_subscriptions(id)
    return {"deleted": True}
