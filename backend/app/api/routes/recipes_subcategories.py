from fastapi import APIRouter, HTTPException
from app.schemas.recipes_subcategories import RecipesSubcategories
from app.services import recipes_subcategories_service

router = APIRouter(prefix="/recipes_subcategories", tags=["RecipesSubcategories"])

@router.get("/", response_model=list[RecipesSubcategories])
def list_recipes_subcategories(
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
    return recipes_subcategories_service.get_all_recipes_subcategories(filters)

@router.get("/{id}", response_model=RecipesSubcategories)
def get_recipes_subcategories(id: int):
    item = recipes_subcategories_service.get_recipes_subcategories_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecipesSubcategories not found")
    return item

@router.post("/", response_model=RecipesSubcategories)
def create_recipes_subcategories(data: RecipesSubcategories):
    created = recipes_subcategories_service.create_recipes_subcategories(data.dict())
    return RecipesSubcategories(**created)

@router.patch("/{id}", response_model=RecipesSubcategories)
def update_recipes_subcategories(id: int, data: RecipesSubcategories):
    updated = recipes_subcategories_service.update_recipes_subcategories(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="RecipesSubcategories not found")
    return RecipesSubcategories(**updated)

@router.delete("/{id}")
def delete_recipes_subcategories(id: int):
    recipes_subcategories_service.delete_recipes_subcategories(id)
    return {"deleted": True}
