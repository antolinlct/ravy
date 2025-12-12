from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.mercuriale_articles import MercurialeArticles
from app.services import mercuriale_articles_service

router = APIRouter(prefix="/mercuriale_articles", tags=["MercurialeArticles"])

@router.get("/", response_model=list[MercurialeArticles])
def list_mercuriale_articles(
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
    return mercuriale_articles_service.get_all_mercuriale_articles(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MercurialeArticles)
def get_mercuriale_articles(id: UUID):
    item = mercuriale_articles_service.get_mercuriale_articles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MercurialeArticles not found")
    return item

@router.post("/", response_model=MercurialeArticles)
def create_mercuriale_articles(data: MercurialeArticles):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = mercuriale_articles_service.create_mercuriale_articles(payload)
    return MercurialeArticles(**created)

@router.patch("/{id}", response_model=MercurialeArticles)
def update_mercuriale_articles(id: UUID, data: MercurialeArticles):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = mercuriale_articles_service.update_mercuriale_articles(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="MercurialeArticles not found")
    return MercurialeArticles(**updated)

@router.delete("/{id}")
def delete_mercuriale_articles(id: UUID):
    mercuriale_articles_service.delete_mercuriale_articles(id)
    return {"deleted": True}
