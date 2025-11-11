from fastapi import APIRouter, HTTPException
from app.schemas.recipe_margin_category import RecipeMarginCategory
from app.services import recipe_margin_category_service

router = APIRouter(prefix="/recipe_margin_category", tags=["RecipeMarginCategory"])

@router.get("/", response_model=list[RecipeMarginCategory])
def list_recipe_margin_category(
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
    return recipe_margin_category_service.get_all_recipe_margin_category(filters)

@router.get("/{id}", response_model=RecipeMarginCategory)
def get_recipe_margin_category(id: int):
    item = recipe_margin_category_service.get_recipe_margin_category_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecipeMarginCategory not found")
    return item

@router.post("/", response_model=RecipeMarginCategory)
def create_recipe_margin_category(data: RecipeMarginCategory):
    created = recipe_margin_category_service.create_recipe_margin_category(data.dict())
    return RecipeMarginCategory(**created)

@router.patch("/{id}", response_model=RecipeMarginCategory)
def update_recipe_margin_category(id: int, data: RecipeMarginCategory):
    updated = recipe_margin_category_service.update_recipe_margin_category(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="RecipeMarginCategory not found")
    return RecipeMarginCategory(**updated)

@router.delete("/{id}")
def delete_recipe_margin_category(id: int):
    recipe_margin_category_service.delete_recipe_margin_category(id)
    return {"deleted": True}
