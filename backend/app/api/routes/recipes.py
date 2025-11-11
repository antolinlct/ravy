from fastapi import APIRouter, HTTPException
from app.schemas.recipes import Recipes
from app.services import recipes_service

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.get("/", response_model=list[Recipes])
def list_recipes(
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
    return recipes_service.get_all_recipes(filters)

@router.get("/{id}", response_model=Recipes)
def get_recipes(id: int):
    item = recipes_service.get_recipes_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Recipes not found")
    return item

@router.post("/", response_model=Recipes)
def create_recipes(data: Recipes):
    created = recipes_service.create_recipes(data.dict())
    return Recipes(**created)

@router.patch("/{id}", response_model=Recipes)
def update_recipes(id: int, data: Recipes):
    updated = recipes_service.update_recipes(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Recipes not found")
    return Recipes(**updated)

@router.delete("/{id}")
def delete_recipes(id: int):
    recipes_service.delete_recipes(id)
    return {"deleted": True}
