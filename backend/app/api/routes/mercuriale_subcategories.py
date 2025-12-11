from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.mercuriale_subcategories import MercurialeSubcategories
from app.services import mercuriale_subcategories_service

router = APIRouter(prefix="/mercuriale_subcategories", tags=["MercurialeSubcategories"])

@router.get("/", response_model=list[MercurialeSubcategories])
def list_mercuriale_subcategories(
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
    return mercuriale_subcategories_service.get_all_mercuriale_subcategories(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MercurialeSubcategories)
def get_mercuriale_subcategories(id: UUID):
    item = mercuriale_subcategories_service.get_mercuriale_subcategories_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MercurialeSubcategories not found")
    return item

@router.post("/", response_model=MercurialeSubcategories)
def create_mercuriale_subcategories(data: MercurialeSubcategories):
    created = mercuriale_subcategories_service.create_mercuriale_subcategories(data.dict())
    return MercurialeSubcategories(**created)

@router.patch("/{id}", response_model=MercurialeSubcategories)
def update_mercuriale_subcategories(id: int, data: MercurialeSubcategories):
    updated = mercuriale_subcategories_service.update_mercuriale_subcategories(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MercurialeSubcategories not found")
    return MercurialeSubcategories(**updated)

@router.delete("/{id}")
def delete_mercuriale_subcategories(id: UUID):
    mercuriale_subcategories_service.delete_mercuriale_subcategories(id)
    return {"deleted": True}
