from fastapi import APIRouter, HTTPException
from app.schemas.subscription_applied_features import SubscriptionAppliedFeatures
from app.services import subscription_applied_features_service

router = APIRouter(prefix="/subscription_applied_features", tags=["SubscriptionAppliedFeatures"])

@router.get("/", response_model=list[SubscriptionAppliedFeatures])
def list_subscription_applied_features(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return subscription_applied_features_service.get_all_subscription_applied_features(filters)

@router.get("/{id}", response_model=SubscriptionAppliedFeatures)
def get_subscription_applied_features(id: int):
    item = subscription_applied_features_service.get_subscription_applied_features_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="SubscriptionAppliedFeatures not found")
    return item

@router.post("/", response_model=SubscriptionAppliedFeatures)
def create_subscription_applied_features(data: SubscriptionAppliedFeatures):
    created = subscription_applied_features_service.create_subscription_applied_features(data.dict())
    return SubscriptionAppliedFeatures(**created)

@router.patch("/{id}", response_model=SubscriptionAppliedFeatures)
def update_subscription_applied_features(id: int, data: SubscriptionAppliedFeatures):
    updated = subscription_applied_features_service.update_subscription_applied_features(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="SubscriptionAppliedFeatures not found")
    return SubscriptionAppliedFeatures(**updated)

@router.delete("/{id}")
def delete_subscription_applied_features(id: int):
    subscription_applied_features_service.delete_subscription_applied_features(id)
    return {"deleted": True}
