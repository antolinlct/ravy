from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.live_score import LiveScore
from app.services import live_score_service

router = APIRouter(prefix="/live_score", tags=["LiveScore"])

@router.get("/", response_model=list[LiveScore])
def list_live_score(
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
    return live_score_service.get_all_live_score(filters, limit=limit, page=page)

@router.get("/{id}", response_model=LiveScore)
def get_live_score(id: UUID):
    item = live_score_service.get_live_score_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="LiveScore not found")
    return item

@router.post("/", response_model=LiveScore)
def create_live_score(data: LiveScore):
    created = live_score_service.create_live_score(data.dict())
    return LiveScore(**created)

@router.patch("/{id}", response_model=LiveScore)
def update_live_score(id: int, data: LiveScore):
    updated = live_score_service.update_live_score(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="LiveScore not found")
    return LiveScore(**updated)

@router.delete("/{id}")
def delete_live_score(id: UUID):
    live_score_service.delete_live_score(id)
    return {"deleted": True}
