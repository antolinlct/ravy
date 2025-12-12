from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.variations import Variations
from app.services import variations_service

router = APIRouter(prefix="/variations", tags=["Variations"])

@router.get("/", response_model=list[Variations])
def list_variations(
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
    return variations_service.get_all_variations(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Variations)
def get_variations(id: UUID):
    item = variations_service.get_variations_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Variations not found")
    return item

@router.post("/", response_model=Variations)
def create_variations(data: Variations):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = variations_service.create_variations(payload)
    return Variations(**created)

@router.patch("/{id}", response_model=Variations)
def update_variations(id: UUID, data: Variations):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = variations_service.update_variations(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Variations not found")
    return Variations(**updated)

@router.delete("/{id}")
def delete_variations(id: UUID):
    variations_service.delete_variations(id)
    return {"deleted": True}
