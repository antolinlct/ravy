from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.establishments import Establishments
from app.services import establishments_service

router = APIRouter(prefix="/establishments", tags=["Establishments"])

@router.get("/", response_model=list[Establishments])
def list_establishments(
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
    return establishments_service.get_all_establishments(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Establishments)
def get_establishments(id: UUID):
    item = establishments_service.get_establishments_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Establishments not found")
    return item

@router.post("/", response_model=Establishments)
def create_establishments(data: Establishments):
    payload = jsonable_encoder(data.dict())
    created = establishments_service.create_establishments(payload)
    return Establishments(**created)

@router.patch("/{id}", response_model=Establishments)
def update_establishments(id: UUID, data: Establishments):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = establishments_service.update_establishments(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Establishments not found")
    return Establishments(**updated)

@router.delete("/{id}")
def delete_establishments(id: UUID):
    establishments_service.delete_establishments(id)
    return {"deleted": True}
