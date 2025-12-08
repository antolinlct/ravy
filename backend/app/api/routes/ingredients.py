from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.ingredients import Ingredients
from app.services import ingredients_service

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])

@router.get("/", response_model=list[Ingredients])
def list_ingredients(
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
    return ingredients_service.get_all_ingredients(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Ingredients)
def get_ingredients(id: int):
    item = ingredients_service.get_ingredients_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Ingredients not found")
    return item

@router.post("/", response_model=Ingredients)
def create_ingredients(data: Ingredients):
    created = ingredients_service.create_ingredients(data.dict())
    return Ingredients(**created)

@router.patch("/{id}", response_model=Ingredients)
def update_ingredients(id: int, data: Ingredients):
    updated = ingredients_service.update_ingredients(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Ingredients not found")
    return Ingredients(**updated)

@router.delete("/{id}")
def delete_ingredients(id: int):
    ingredients_service.delete_ingredients(id)
    return {"deleted": True}
