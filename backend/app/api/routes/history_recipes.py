from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.history_recipes import HistoryRecipes
from app.services import history_recipes_service

router = APIRouter(prefix="/history_recipes", tags=["HistoryRecipes"])

@router.get("/", response_model=list[HistoryRecipes])
def list_history_recipes(
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
    return history_recipes_service.get_all_history_recipes(filters, limit=limit, page=page)

@router.get("/{id}", response_model=HistoryRecipes)
def get_history_recipes(id: UUID):
    item = history_recipes_service.get_history_recipes_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="HistoryRecipes not found")
    return item

@router.post("/", response_model=HistoryRecipes)
def create_history_recipes(data: HistoryRecipes):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = history_recipes_service.create_history_recipes(payload)
    return HistoryRecipes(**created)

@router.patch("/{id}", response_model=HistoryRecipes)
def update_history_recipes(id: UUID, data: HistoryRecipes):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = history_recipes_service.update_history_recipes(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="HistoryRecipes not found")
    return HistoryRecipes(**updated)

@router.delete("/{id}")
def delete_history_recipes(id: UUID):
    history_recipes_service.delete_history_recipes(id)
    return {"deleted": True}
