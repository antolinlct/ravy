from fastapi import APIRouter, HTTPException
from app.schemas.price import Price
from app.services import price_service

router = APIRouter(prefix="/price", tags=["Price"])

@router.get("/", response_model=list[Price])
def list_price(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = 200,
    page: int | None = 1,
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return price_service.get_all_price(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Price)
def get_price(id: int):
    item = price_service.get_price_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Price not found")
    return item

@router.post("/", response_model=Price)
def create_price(data: Price):
    created = price_service.create_price(data.dict())
    return Price(**created)

@router.patch("/{id}", response_model=Price)
def update_price(id: int, data: Price):
    updated = price_service.update_price(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Price not found")
    return Price(**updated)

@router.delete("/{id}")
def delete_price(id: int):
    price_service.delete_price(id)
    return {"deleted": True}
