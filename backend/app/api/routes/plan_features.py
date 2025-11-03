from fastapi import APIRouter, HTTPException
from app.schemas.plan_features import PlanFeatures
from app.services import plan_features_service

router = APIRouter(prefix="/plan_features", tags=["PlanFeatures"])

@router.get("/", response_model=list[PlanFeatures])
def list_plan_features(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return plan_features_service.get_all_plan_features(filters)

@router.get("/{id}", response_model=PlanFeatures)
def get_plan_features(id: int):
    item = plan_features_service.get_plan_features_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="PlanFeatures not found")
    return item

@router.post("/", response_model=PlanFeatures)
def create_plan_features(data: PlanFeatures):
    created = plan_features_service.create_plan_features(data.dict())
    return PlanFeatures(**created)

@router.patch("/{id}", response_model=PlanFeatures)
def update_plan_features(id: int, data: PlanFeatures):
    updated = plan_features_service.update_plan_features(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="PlanFeatures not found")
    return PlanFeatures(**updated)

@router.delete("/{id}")
def delete_plan_features(id: int):
    plan_features_service.delete_plan_features(id)
    return {"deleted": True}
