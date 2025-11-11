from fastapi import APIRouter, HTTPException
from app.schemas.establishments import Establishments
from app.services import establishments_service

router = APIRouter(prefix="/establishments", tags=["Establishments"])

@router.get("/", response_model=list[Establishments])
def list_establishments(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = None,
    establishment_id: str | None = None,
    supplier_id: str | None = None,
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "establishment_id": establishment_id,
        "supplier_id": supplier_id,
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return establishments_service.get_all_establishments(filters)

@router.get("/{id}", response_model=Establishments)
def get_establishments(id: int):
    item = establishments_service.get_establishments_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Establishments not found")
    return item

@router.post("/", response_model=Establishments)
def create_establishments(data: Establishments):
    created = establishments_service.create_establishments(data.dict())
    return Establishments(**created)

@router.patch("/{id}", response_model=Establishments)
def update_establishments(id: int, data: Establishments):
    updated = establishments_service.update_establishments(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Establishments not found")
    return Establishments(**updated)

@router.delete("/{id}")
def delete_establishments(id: int):
    establishments_service.delete_establishments(id)
    return {"deleted": True}
