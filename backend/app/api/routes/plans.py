from fastapi import APIRouter, HTTPException
from app.schemas.plans import Plans
from app.services import plans_service

router = APIRouter(prefix="/plans", tags=["Plans"])

@router.get("/", response_model=list[Plans])
def list_plans(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return plans_service.get_all_plans(filters)

@router.get("/{id}", response_model=Plans)
def get_plans(id: int):
    item = plans_service.get_plans_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Plans not found")
    return item

@router.post("/", response_model=Plans)
def create_plans(data: Plans):
    created = plans_service.create_plans(data.dict())
    return Plans(**created)

@router.patch("/{id}", response_model=Plans)
def update_plans(id: int, data: Plans):
    updated = plans_service.update_plans(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Plans not found")
    return Plans(**updated)

@router.delete("/{id}")
def delete_plans(id: int):
    plans_service.delete_plans(id)
    return {"deleted": True}
