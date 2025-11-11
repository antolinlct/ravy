from fastapi import APIRouter, HTTPException
from app.schemas.suppliers import Suppliers
from app.services import suppliers_service

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=list[Suppliers])
def list_suppliers(
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
    return suppliers_service.get_all_suppliers(filters)

@router.get("/{id}", response_model=Suppliers)
def get_suppliers(id: int):
    item = suppliers_service.get_suppliers_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Suppliers not found")
    return item

@router.post("/", response_model=Suppliers)
def create_suppliers(data: Suppliers):
    created = suppliers_service.create_suppliers(data.dict())
    return Suppliers(**created)

@router.patch("/{id}", response_model=Suppliers)
def update_suppliers(id: int, data: Suppliers):
    updated = suppliers_service.update_suppliers(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Suppliers not found")
    return Suppliers(**updated)

@router.delete("/{id}")
def delete_suppliers(id: int):
    suppliers_service.delete_suppliers(id)
    return {"deleted": True}
