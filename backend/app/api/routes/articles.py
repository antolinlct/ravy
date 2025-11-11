from fastapi import APIRouter, HTTPException
from app.schemas.articles import Articles
from app.services import articles_service

router = APIRouter(prefix="/articles", tags=["Articles"])

@router.get("/", response_model=list[Articles])
def list_articles(
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
    return articles_service.get_all_articles(filters)

@router.get("/{id}", response_model=Articles)
def get_articles(id: int):
    item = articles_service.get_articles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Articles not found")
    return item

@router.post("/", response_model=Articles)
def create_articles(data: Articles):
    created = articles_service.create_articles(data.dict())
    return Articles(**created)

@router.patch("/{id}", response_model=Articles)
def update_articles(id: int, data: Articles):
    updated = articles_service.update_articles(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Articles not found")
    return Articles(**updated)

@router.delete("/{id}")
def delete_articles(id: int):
    articles_service.delete_articles(id)
    return {"deleted": True}
