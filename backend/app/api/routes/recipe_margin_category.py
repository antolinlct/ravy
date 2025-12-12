from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.recipe_margin_category import RecipeMarginCategory
from app.services import recipe_margin_category_service

router = APIRouter(prefix="/recipe_margin_category", tags=["RecipeMarginCategory"])

@router.get("/", response_model=list[RecipeMarginCategory])
def list_recipe_margin_category(
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
    return recipe_margin_category_service.get_all_recipe_margin_category(filters, limit=limit, page=page)

@router.get("/{id}", response_model=RecipeMarginCategory)
def get_recipe_margin_category(id: UUID):
    item = recipe_margin_category_service.get_recipe_margin_category_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecipeMarginCategory not found")
    return item

@router.post("/", response_model=RecipeMarginCategory)
def create_recipe_margin_category(data: RecipeMarginCategory):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = recipe_margin_category_service.create_recipe_margin_category(payload)
    return RecipeMarginCategory(**created)

@router.patch("/{id}", response_model=RecipeMarginCategory)
def update_recipe_margin_category(id: UUID, data: RecipeMarginCategory):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = recipe_margin_category_service.update_recipe_margin_category(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="RecipeMarginCategory not found")
    return RecipeMarginCategory(**updated)

@router.delete("/{id}")
def delete_recipe_margin_category(id: UUID):
    recipe_margin_category_service.delete_recipe_margin_category(id)
    return {"deleted": True}
