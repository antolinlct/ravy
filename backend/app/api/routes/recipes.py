from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.recipes import Recipes
from app.services import recipes_service

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.get("/", response_model=list[Recipes])
def list_recipes(
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
    return recipes_service.get_all_recipes(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Recipes)
def get_recipes(id: UUID):
    item = recipes_service.get_recipes_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Recipes not found")
    return item

@router.post("/", response_model=Recipes)
def create_recipes(data: Recipes):
    payload = jsonable_encoder(data.dict())
    created = recipes_service.create_recipes(payload)
    return Recipes(**created)

@router.patch("/{id}", response_model=Recipes)
def update_recipes(id: UUID, data: Recipes):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = recipes_service.update_recipes(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Recipes not found")
    return Recipes(**updated)

@router.delete("/{id}")
def delete_recipes(id: UUID):
    recipes_service.delete_recipes(id)
    return {"deleted": True}
