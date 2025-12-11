from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.price_stripe import PriceStripe
from app.services import price_stripe_service

router = APIRouter(prefix="/price_stripe", tags=["PriceStripe"])

@router.get("/", response_model=list[PriceStripe])
def list_price_stripe(
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
    return price_stripe_service.get_all_price_stripe(filters, limit=limit, page=page)

@router.get("/{id}", response_model=PriceStripe)
def get_price_stripe(id: UUID):
    item = price_stripe_service.get_price_stripe_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="PriceStripe not found")
    return item

@router.post("/", response_model=PriceStripe)
def create_price_stripe(data: PriceStripe):
    payload = jsonable_encoder(data.dict())
    created = price_stripe_service.create_price_stripe(payload)
    return PriceStripe(**created)

@router.patch("/{id}", response_model=PriceStripe)
def update_price_stripe(id: UUID, data: PriceStripe):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = price_stripe_service.update_price_stripe(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="PriceStripe not found")
    return PriceStripe(**updated)

@router.delete("/{id}")
def delete_price_stripe(id: UUID):
    price_stripe_service.delete_price_stripe(id)
    return {"deleted": True}
