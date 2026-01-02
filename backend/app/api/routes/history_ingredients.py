from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.history_ingredients import HistoryIngredients
from app.services import history_ingredients_service

router = APIRouter(prefix="/history_ingredients", tags=["HistoryIngredients"])

@router.get("/", response_model=list[HistoryIngredients])
def list_history_ingredients(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None,
    recipe_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id, "recipe_id": recipe_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return history_ingredients_service.get_all_history_ingredients(filters, limit=limit, page=page)

@router.get("/{id}", response_model=HistoryIngredients)
def get_history_ingredients(id: UUID):
    item = history_ingredients_service.get_history_ingredients_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="HistoryIngredients not found")
    return item

@router.post("/", response_model=HistoryIngredients)
def create_history_ingredients(data: HistoryIngredients):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = history_ingredients_service.create_history_ingredients(payload)
    return HistoryIngredients(**created)

@router.patch("/{id}", response_model=HistoryIngredients)
def update_history_ingredients(id: UUID, data: HistoryIngredients):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = history_ingredients_service.update_history_ingredients(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="HistoryIngredients not found")
    return HistoryIngredients(**updated)

@router.delete("/{id}")
def delete_history_ingredients(id: UUID):
    history_ingredients_service.delete_history_ingredients(id)
    return {"deleted": True}
