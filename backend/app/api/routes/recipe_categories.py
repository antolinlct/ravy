from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.recipe_categories import RecipeCategories
from app.services import recipe_categories_service

router = APIRouter(prefix="/recipe_categories", tags=["RecipeCategories"])

@router.get("/", response_model=list[RecipeCategories])
def list_recipe_categories(
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
    return recipe_categories_service.get_all_recipe_categories(filters, limit=limit, page=page)

@router.get("/{id}", response_model=RecipeCategories)
def get_recipe_categories(id: UUID):
    item = recipe_categories_service.get_recipe_categories_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecipeCategories not found")
    return item

@router.post("/", response_model=RecipeCategories)
def create_recipe_categories(data: RecipeCategories):
    payload = jsonable_encoder(data.dict())
    created = recipe_categories_service.create_recipe_categories(payload)
    return RecipeCategories(**created)

@router.patch("/{id}", response_model=RecipeCategories)
def update_recipe_categories(id: UUID, data: RecipeCategories):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = recipe_categories_service.update_recipe_categories(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="RecipeCategories not found")
    return RecipeCategories(**updated)

@router.delete("/{id}")
def delete_recipe_categories(id: UUID):
    recipe_categories_service.delete_recipe_categories(id)
    return {"deleted": True}
