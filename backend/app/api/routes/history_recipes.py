from fastapi import APIRouter, HTTPException
from app.schemas.history_recipes import HistoryRecipes
from app.services import history_recipes_service

router = APIRouter(prefix="/history_recipes", tags=["HistoryRecipes"])

@router.get("/", response_model=list[HistoryRecipes])
def list_history_recipes(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return history_recipes_service.get_all_history_recipes(filters)

@router.get("/{id}", response_model=HistoryRecipes)
def get_history_recipes(id: int):
    item = history_recipes_service.get_history_recipes_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="HistoryRecipes not found")
    return item

@router.post("/", response_model=HistoryRecipes)
def create_history_recipes(data: HistoryRecipes):
    created = history_recipes_service.create_history_recipes(data.dict())
    return HistoryRecipes(**created)

@router.patch("/{id}", response_model=HistoryRecipes)
def update_history_recipes(id: int, data: HistoryRecipes):
    updated = history_recipes_service.update_history_recipes(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="HistoryRecipes not found")
    return HistoryRecipes(**updated)

@router.delete("/{id}")
def delete_history_recipes(id: int):
    history_recipes_service.delete_history_recipes(id)
    return {"deleted": True}
