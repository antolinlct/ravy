from fastapi import APIRouter, HTTPException
from app.schemas.market_master_articles import MarketMasterArticles
from app.services import market_master_articles_service

router = APIRouter(prefix="/market_master_articles", tags=["MarketMasterArticles"])

@router.get("/", response_model=list[MarketMasterArticles])
def list_market_master_articles(
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
    return market_master_articles_service.get_all_market_master_articles(filters)

@router.get("/{id}", response_model=MarketMasterArticles)
def get_market_master_articles(id: int):
    item = market_master_articles_service.get_market_master_articles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MarketMasterArticles not found")
    return item

@router.post("/", response_model=MarketMasterArticles)
def create_market_master_articles(data: MarketMasterArticles):
    created = market_master_articles_service.create_market_master_articles(data.dict())
    return MarketMasterArticles(**created)

@router.patch("/{id}", response_model=MarketMasterArticles)
def update_market_master_articles(id: int, data: MarketMasterArticles):
    updated = market_master_articles_service.update_market_master_articles(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MarketMasterArticles not found")
    return MarketMasterArticles(**updated)

@router.delete("/{id}")
def delete_market_master_articles(id: int):
    market_master_articles_service.delete_market_master_articles(id)
    return {"deleted": True}
