from fastapi import APIRouter, HTTPException
from app.schemas.mercuriale_articles import MercurialeArticles
from app.services import mercuriale_articles_service

router = APIRouter(prefix="/mercuriale_articles", tags=["MercurialeArticles"])

@router.get("/", response_model=list[MercurialeArticles])
def list_mercuriale_articles(
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
    return mercuriale_articles_service.get_all_mercuriale_articles(filters)

@router.get("/{id}", response_model=MercurialeArticles)
def get_mercuriale_articles(id: int):
    item = mercuriale_articles_service.get_mercuriale_articles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MercurialeArticles not found")
    return item

@router.post("/", response_model=MercurialeArticles)
def create_mercuriale_articles(data: MercurialeArticles):
    created = mercuriale_articles_service.create_mercuriale_articles(data.dict())
    return MercurialeArticles(**created)

@router.patch("/{id}", response_model=MercurialeArticles)
def update_mercuriale_articles(id: int, data: MercurialeArticles):
    updated = mercuriale_articles_service.update_mercuriale_articles(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MercurialeArticles not found")
    return MercurialeArticles(**updated)

@router.delete("/{id}")
def delete_mercuriale_articles(id: int):
    mercuriale_articles_service.delete_mercuriale_articles(id)
    return {"deleted": True}
