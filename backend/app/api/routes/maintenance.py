from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.maintenance import Maintenance
from app.services import maintenance_service

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.get("/", response_model=list[Maintenance])
def list_maintenance(
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
    return maintenance_service.get_all_maintenance(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Maintenance)
def get_maintenance(id: int):
    item = maintenance_service.get_maintenance_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    return item

@router.post("/", response_model=Maintenance)
def create_maintenance(data: Maintenance):
    created = maintenance_service.create_maintenance(data.dict())
    return Maintenance(**created)

@router.patch("/{id}", response_model=Maintenance)
def update_maintenance(id: int, data: Maintenance):
    updated = maintenance_service.update_maintenance(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Maintenance not found")
    return Maintenance(**updated)

@router.delete("/{id}")
def delete_maintenance(id: int):
    maintenance_service.delete_maintenance(id)
    return {"deleted": True}
