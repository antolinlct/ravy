from fastapi import APIRouter, HTTPException
from app.schemas.history_ingredients import HistoryIngredients
from app.services import history_ingredients_service

router = APIRouter(prefix="/history_ingredients", tags=["HistoryIngredients"])

@router.get("/", response_model=list[HistoryIngredients])
def list_history_ingredients(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = 200,
    page: int | None = 1,
    establishment_id: str | None = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return history_ingredients_service.get_all_history_ingredients(filters, limit=limit, page=page)

@router.get("/{id}", response_model=HistoryIngredients)
def get_history_ingredients(id: int):
    item = history_ingredients_service.get_history_ingredients_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="HistoryIngredients not found")
    return item

@router.post("/", response_model=HistoryIngredients)
def create_history_ingredients(data: HistoryIngredients):
    created = history_ingredients_service.create_history_ingredients(data.dict())
    return HistoryIngredients(**created)

@router.patch("/{id}", response_model=HistoryIngredients)
def update_history_ingredients(id: int, data: HistoryIngredients):
    updated = history_ingredients_service.update_history_ingredients(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="HistoryIngredients not found")
    return HistoryIngredients(**updated)

@router.delete("/{id}")
def delete_history_ingredients(id: int):
    history_ingredients_service.delete_history_ingredients(id)
    return {"deleted": True}
