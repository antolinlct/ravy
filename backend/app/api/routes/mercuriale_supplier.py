from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.mercuriale_supplier import MercurialeSupplier
from app.services import mercuriale_supplier_service

router = APIRouter(prefix="/mercuriale_supplier", tags=["MercurialeSupplier"])

@router.get("/", response_model=list[MercurialeSupplier])
def list_mercuriale_supplier(
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
    return mercuriale_supplier_service.get_all_mercuriale_supplier(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MercurialeSupplier)
def get_mercuriale_supplier(id: UUID):
    item = mercuriale_supplier_service.get_mercuriale_supplier_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MercurialeSupplier not found")
    return item

@router.post("/", response_model=MercurialeSupplier)
def create_mercuriale_supplier(data: MercurialeSupplier):
    payload = jsonable_encoder(data.dict())
    created = mercuriale_supplier_service.create_mercuriale_supplier(payload)
    return MercurialeSupplier(**created)

@router.patch("/{id}", response_model=MercurialeSupplier)
def update_mercuriale_supplier(id: UUID, data: MercurialeSupplier):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = mercuriale_supplier_service.update_mercuriale_supplier(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="MercurialeSupplier not found")
    return MercurialeSupplier(**updated)

@router.delete("/{id}")
def delete_mercuriale_supplier(id: UUID):
    mercuriale_supplier_service.delete_mercuriale_supplier(id)
    return {"deleted": True}
