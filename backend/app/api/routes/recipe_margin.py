from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.recipe_margin import RecipeMargin
from app.services import recipe_margin_service

router = APIRouter(prefix="/recipe_margin", tags=["RecipeMargin"])

@router.get("/", response_model=list[RecipeMargin])
def list_recipe_margin(
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
    return recipe_margin_service.get_all_recipe_margin(filters, limit=limit, page=page)

@router.get("/{id}", response_model=RecipeMargin)
def get_recipe_margin(id: int):
    item = recipe_margin_service.get_recipe_margin_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecipeMargin not found")
    return item

@router.post("/", response_model=RecipeMargin)
def create_recipe_margin(data: RecipeMargin):
    created = recipe_margin_service.create_recipe_margin(data.dict())
    return RecipeMargin(**created)

@router.patch("/{id}", response_model=RecipeMargin)
def update_recipe_margin(id: int, data: RecipeMargin):
    updated = recipe_margin_service.update_recipe_margin(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="RecipeMargin not found")
    return RecipeMargin(**updated)

@router.delete("/{id}")
def delete_recipe_margin(id: int):
    recipe_margin_service.delete_recipe_margin(id)
    return {"deleted": True}
