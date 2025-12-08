from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.recipe_margin_subcategory import RecipeMarginSubcategory
from app.services import recipe_margin_subcategory_service

router = APIRouter(prefix="/recipe_margin_subcategory", tags=["RecipeMarginSubcategory"])

@router.get("/", response_model=list[RecipeMarginSubcategory])
def list_recipe_margin_subcategory(
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
    return recipe_margin_subcategory_service.get_all_recipe_margin_subcategory(filters, limit=limit, page=page)

@router.get("/{id}", response_model=RecipeMarginSubcategory)
def get_recipe_margin_subcategory(id: int):
    item = recipe_margin_subcategory_service.get_recipe_margin_subcategory_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecipeMarginSubcategory not found")
    return item

@router.post("/", response_model=RecipeMarginSubcategory)
def create_recipe_margin_subcategory(data: RecipeMarginSubcategory):
    created = recipe_margin_subcategory_service.create_recipe_margin_subcategory(data.dict())
    return RecipeMarginSubcategory(**created)

@router.patch("/{id}", response_model=RecipeMarginSubcategory)
def update_recipe_margin_subcategory(id: int, data: RecipeMarginSubcategory):
    updated = recipe_margin_subcategory_service.update_recipe_margin_subcategory(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="RecipeMarginSubcategory not found")
    return RecipeMarginSubcategory(**updated)

@router.delete("/{id}")
def delete_recipe_margin_subcategory(id: int):
    recipe_margin_subcategory_service.delete_recipe_margin_subcategory(id)
    return {"deleted": True}
