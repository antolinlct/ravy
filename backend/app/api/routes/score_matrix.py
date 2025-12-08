from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.score_matrix import ScoreMatrix
from app.services import score_matrix_service

router = APIRouter(prefix="/score_matrix", tags=["ScoreMatrix"])

@router.get("/", response_model=list[ScoreMatrix])
def list_score_matrix(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return score_matrix_service.get_all_score_matrix(filters, limit=limit, page=page)

@router.get("/{id}", response_model=ScoreMatrix)
def get_score_matrix(id: int):
    item = score_matrix_service.get_score_matrix_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="ScoreMatrix not found")
    return item

@router.post("/", response_model=ScoreMatrix)
def create_score_matrix(data: ScoreMatrix):
    created = score_matrix_service.create_score_matrix(data.dict())
    return ScoreMatrix(**created)

@router.patch("/{id}", response_model=ScoreMatrix)
def update_score_matrix(id: int, data: ScoreMatrix):
    updated = score_matrix_service.update_score_matrix(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="ScoreMatrix not found")
    return ScoreMatrix(**updated)

@router.delete("/{id}")
def delete_score_matrix(id: int):
    score_matrix_service.delete_score_matrix(id)
    return {"deleted": True}
