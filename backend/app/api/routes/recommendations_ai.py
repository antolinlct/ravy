from fastapi import APIRouter, HTTPException
from app.schemas.recommendations_ai import RecommendationsAi
from app.services import recommendations_ai_service

router = APIRouter(prefix="/recommendations_ai", tags=["RecommendationsAi"])

@router.get("/", response_model=list[RecommendationsAi])
def list_recommendations_ai(
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
    return recommendations_ai_service.get_all_recommendations_ai(filters)

@router.get("/{id}", response_model=RecommendationsAi)
def get_recommendations_ai(id: int):
    item = recommendations_ai_service.get_recommendations_ai_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="RecommendationsAi not found")
    return item

@router.post("/", response_model=RecommendationsAi)
def create_recommendations_ai(data: RecommendationsAi):
    created = recommendations_ai_service.create_recommendations_ai(data.dict())
    return RecommendationsAi(**created)

@router.patch("/{id}", response_model=RecommendationsAi)
def update_recommendations_ai(id: int, data: RecommendationsAi):
    updated = recommendations_ai_service.update_recommendations_ai(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="RecommendationsAi not found")
    return RecommendationsAi(**updated)

@router.delete("/{id}")
def delete_recommendations_ai(id: int):
    recommendations_ai_service.delete_recommendations_ai(id)
    return {"deleted": True}
