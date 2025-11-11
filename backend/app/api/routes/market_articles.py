from fastapi import APIRouter, HTTPException
from app.schemas.market_articles import MarketArticles
from app.services import market_articles_service

router = APIRouter(prefix="/market_articles", tags=["MarketArticles"])

@router.get("/", response_model=list[MarketArticles])
def list_market_articles(
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
    return market_articles_service.get_all_market_articles(filters)

@router.get("/{id}", response_model=MarketArticles)
def get_market_articles(id: int):
    item = market_articles_service.get_market_articles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MarketArticles not found")
    return item

@router.post("/", response_model=MarketArticles)
def create_market_articles(data: MarketArticles):
    created = market_articles_service.create_market_articles(data.dict())
    return MarketArticles(**created)

@router.patch("/{id}", response_model=MarketArticles)
def update_market_articles(id: int, data: MarketArticles):
    updated = market_articles_service.update_market_articles(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MarketArticles not found")
    return MarketArticles(**updated)

@router.delete("/{id}")
def delete_market_articles(id: int):
    market_articles_service.delete_market_articles(id)
    return {"deleted": True}
