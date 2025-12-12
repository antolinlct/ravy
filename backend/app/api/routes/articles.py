from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.articles import Articles
from app.services import articles_service

router = APIRouter(prefix="/articles", tags=["Articles"])

@router.get("/", response_model=list[Articles])
def list_articles(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None,
    supplier_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id, "supplier_id": supplier_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return articles_service.get_all_articles(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Articles)
def get_articles(id: UUID):
    item = articles_service.get_articles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Articles not found")
    return item

@router.post("/", response_model=Articles)
def create_articles(data: Articles):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = articles_service.create_articles(payload)
    return Articles(**created)

@router.patch("/{id}", response_model=Articles)
def update_articles(id: UUID, data: Articles):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = articles_service.update_articles(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Articles not found")
    return Articles(**updated)

@router.delete("/{id}")
def delete_articles(id: UUID):
    articles_service.delete_articles(id)
    return {"deleted": True}
