from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.recipes import Recipes
from app.services import recipes_service, establishments_service

try:
    from app.services.telegram.gordon_service import GordonTelegram

    _telegram_client = GordonTelegram()

    def _notify_recipe_event(message: str) -> None:
        _telegram_client.send_text(message)
except Exception:
    def _notify_recipe_event(message: str) -> None:
        return


def _safe_get(obj: object, key: str) -> Optional[str]:
    if obj is None:
        return None
    if isinstance(obj, dict):
        return obj.get(key)
    return getattr(obj, key, None)

router = APIRouter(prefix="/recipes", tags=["Recipes"])

@router.get("/", response_model=list[Recipes])
def list_recipes(
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
    return recipes_service.get_all_recipes(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Recipes)
def get_recipes(id: UUID):
    item = recipes_service.get_recipes_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Recipes not found")
    return item

@router.post("/", response_model=Recipes)
def create_recipes(data: Recipes):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = recipes_service.create_recipes(payload)
    try:
        recipe_name = _safe_get(created, "name") or _safe_get(data, "name")
        establishment_id = _safe_get(created, "establishment_id") or _safe_get(
            data, "establishment_id"
        )
        establishment = (
            establishments_service.get_establishments_by_id(establishment_id)
            if establishment_id
            else None
        )
        establishment_name = _safe_get(establishment, "name") or str(establishment_id)
        _notify_recipe_event(
            "🍽️ Recette créée\n"
            f"{recipe_name or 'Recette'}\n"
            f"{establishment_name}"
        )
    except Exception:
        pass
    return Recipes(**created)

@router.patch("/{id}", response_model=Recipes)
def update_recipes(id: UUID, data: Recipes):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = recipes_service.update_recipes(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Recipes not found")
    return Recipes(**updated)

@router.delete("/{id}")
def delete_recipes(id: UUID):
    recipes_service.delete_recipes(id)
    return {"deleted": True}
