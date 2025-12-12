from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.countries import Countries
from app.services import countries_service

router = APIRouter(prefix="/countries", tags=["Countries"])

@router.get("/", response_model=list[Countries])
def list_countries(
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
    return countries_service.get_all_countries(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Countries)
def get_countries(id: UUID):
    item = countries_service.get_countries_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Countries not found")
    return item

@router.post("/", response_model=Countries)
def create_countries(data: Countries):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = countries_service.create_countries(payload)
    return Countries(**created)

@router.patch("/{id}", response_model=Countries)
def update_countries(id: UUID, data: Countries):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = countries_service.update_countries(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Countries not found")
    return Countries(**updated)

@router.delete("/{id}")
def delete_countries(id: UUID):
    countries_service.delete_countries(id)
    return {"deleted": True}
