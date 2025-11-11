from fastapi import APIRouter, HTTPException
from app.schemas.recipe_categories import RecipeCategories
from app.services import recipe_categories_service

router = APIRouter(prefix="/recipe_categories", tags=["RecipeCategories"])

@router.get("/", response_model=list[RecipeCategories])
def list_recipe_categories(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = None,
    establishment_id: str | None = None,
    supplier_id: str | None = None,
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "establishment_id": establishment_id,
        "supplier_id": supplier_id,
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return recipe_categories_service.get_all_recipe_categories(filters)

@router.get("/{id}", response_model=RecipeCategories)
def get_recipe_categories(id: int):
    item = recipe_categories_service.get_recipe_categories_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecipeCategories not found")
    return item

@router.post("/", response_model=RecipeCategories)
def create_recipe_categories(data: RecipeCategories):
    created = recipe_categories_service.create_recipe_categories(data.dict())
    return RecipeCategories(**created)

@router.patch("/{id}", response_model=RecipeCategories)
def update_recipe_categories(id: int, data: RecipeCategories):
    updated = recipe_categories_service.update_recipe_categories(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="RecipeCategories not found")
    return RecipeCategories(**updated)

@router.delete("/{id}")
def delete_recipe_categories(id: int):
    recipe_categories_service.delete_recipe_categories(id)
    return {"deleted": True}
