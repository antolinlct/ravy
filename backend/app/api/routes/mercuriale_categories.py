from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.mercuriale_categories import MercurialeCategories
from app.services import mercuriale_categories_service

router = APIRouter(prefix="/mercuriale_categories", tags=["MercurialeCategories"])

@router.get("/", response_model=list[MercurialeCategories])
def list_mercuriale_categories(
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
    return mercuriale_categories_service.get_all_mercuriale_categories(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MercurialeCategories)
def get_mercuriale_categories(id: UUID):
    item = mercuriale_categories_service.get_mercuriale_categories_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MercurialeCategories not found")
    return item

@router.post("/", response_model=MercurialeCategories)
def create_mercuriale_categories(data: MercurialeCategories):
    created = mercuriale_categories_service.create_mercuriale_categories(data.dict())
    return MercurialeCategories(**created)

@router.patch("/{id}", response_model=MercurialeCategories)
def update_mercuriale_categories(id: int, data: MercurialeCategories):
    updated = mercuriale_categories_service.update_mercuriale_categories(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MercurialeCategories not found")
    return MercurialeCategories(**updated)

@router.delete("/{id}")
def delete_mercuriale_categories(id: UUID):
    mercuriale_categories_service.delete_mercuriale_categories(id)
    return {"deleted": True}
