from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.mercuriale_master_article import MercurialeMasterArticle
from app.services import mercuriale_master_article_service

router = APIRouter(prefix="/mercuriale_master_article", tags=["MercurialeMasterArticle"])

@router.get("/", response_model=list[MercurialeMasterArticle])
def list_mercuriale_master_article(
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
    return mercuriale_master_article_service.get_all_mercuriale_master_article(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MercurialeMasterArticle)
def get_mercuriale_master_article(id: UUID):
    item = mercuriale_master_article_service.get_mercuriale_master_article_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MercurialeMasterArticle not found")
    return item

@router.post("/", response_model=MercurialeMasterArticle)
def create_mercuriale_master_article(data: MercurialeMasterArticle):
    created = mercuriale_master_article_service.create_mercuriale_master_article(data.dict())
    return MercurialeMasterArticle(**created)

@router.patch("/{id}", response_model=MercurialeMasterArticle)
def update_mercuriale_master_article(id: int, data: MercurialeMasterArticle):
    updated = mercuriale_master_article_service.update_mercuriale_master_article(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MercurialeMasterArticle not found")
    return MercurialeMasterArticle(**updated)

@router.delete("/{id}")
def delete_mercuriale_master_article(id: UUID):
    mercuriale_master_article_service.delete_mercuriale_master_article(id)
    return {"deleted": True}
