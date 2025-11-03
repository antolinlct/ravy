from fastapi import APIRouter, HTTPException
from app.schemas.impersonations import Impersonations
from app.services import impersonations_service

router = APIRouter(prefix="/impersonations", tags=["Impersonations"])

@router.get("/", response_model=list[Impersonations])
def list_impersonations(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return impersonations_service.get_all_impersonations(filters)

@router.get("/{id}", response_model=Impersonations)
def get_impersonations(id: int):
    item = impersonations_service.get_impersonations_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Impersonations not found")
    return item

@router.post("/", response_model=Impersonations)
def create_impersonations(data: Impersonations):
    created = impersonations_service.create_impersonations(data.dict())
    return Impersonations(**created)

@router.patch("/{id}", response_model=Impersonations)
def update_impersonations(id: int, data: Impersonations):
    updated = impersonations_service.update_impersonations(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Impersonations not found")
    return Impersonations(**updated)

@router.delete("/{id}")
def delete_impersonations(id: int):
    impersonations_service.delete_impersonations(id)
    return {"deleted": True}
