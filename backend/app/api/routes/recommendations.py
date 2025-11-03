from fastapi import APIRouter, HTTPException
from app.schemas.recommendations import Recommendations
from app.services import recommendations_service

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.get("/", response_model=list[Recommendations])
def list_recommendations(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return recommendations_service.get_all_recommendations(filters)

@router.get("/{id}", response_model=Recommendations)
def get_recommendations(id: int):
    item = recommendations_service.get_recommendations_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Recommendations not found")
    return item

@router.post("/", response_model=Recommendations)
def create_recommendations(data: Recommendations):
    created = recommendations_service.create_recommendations(data.dict())
    return Recommendations(**created)

@router.patch("/{id}", response_model=Recommendations)
def update_recommendations(id: int, data: Recommendations):
    updated = recommendations_service.update_recommendations(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Recommendations not found")
    return Recommendations(**updated)

@router.delete("/{id}")
def delete_recommendations(id: int):
    recommendations_service.delete_recommendations(id)
    return {"deleted": True}
