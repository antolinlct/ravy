from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.mercuriales import Mercuriales
from app.services import mercuriales_service

router = APIRouter(prefix="/mercuriales", tags=["Mercuriales"])

@router.get("/", response_model=list[Mercuriales])
def list_mercuriales(
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
    return mercuriales_service.get_all_mercuriales(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Mercuriales)
def get_mercuriales(id: UUID):
    item = mercuriales_service.get_mercuriales_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Mercuriales not found")
    return item

@router.post("/", response_model=Mercuriales)
def create_mercuriales(data: Mercuriales):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = mercuriales_service.create_mercuriales(payload)
    return Mercuriales(**created)

@router.patch("/{id}", response_model=Mercuriales)
def update_mercuriales(id: UUID, data: Mercuriales):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = mercuriales_service.update_mercuriales(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Mercuriales not found")
    return Mercuriales(**updated)

@router.delete("/{id}")
def delete_mercuriales(id: UUID):
    mercuriales_service.delete_mercuriales(id)
    return {"deleted": True}
