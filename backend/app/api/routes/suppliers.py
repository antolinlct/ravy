from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.suppliers import Suppliers
from app.services import suppliers_service

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=list[Suppliers])
def list_suppliers(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return suppliers_service.get_all_suppliers(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Suppliers)
def get_suppliers(id: UUID):
    item = suppliers_service.get_suppliers_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Suppliers not found")
    return item

@router.post("/", response_model=Suppliers)
def create_suppliers(data: Suppliers):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = suppliers_service.create_suppliers(payload)
    return Suppliers(**created)

@router.patch("/{id}", response_model=Suppliers)
def update_suppliers(id: UUID, data: Suppliers):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = suppliers_service.update_suppliers(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Suppliers not found")
    return Suppliers(**updated)

@router.delete("/{id}")
def delete_suppliers(id: UUID):
    suppliers_service.delete_suppliers(id)
    return {"deleted": True}
