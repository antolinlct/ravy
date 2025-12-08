from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.product_stripe import ProductStripe
from app.services import product_stripe_service

router = APIRouter(prefix="/product_stripe", tags=["ProductStripe"])

@router.get("/", response_model=list[ProductStripe])
def list_product_stripe(
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
    return product_stripe_service.get_all_product_stripe(filters, limit=limit, page=page)

@router.get("/{id}", response_model=ProductStripe)
def get_product_stripe(id: int):
    item = product_stripe_service.get_product_stripe_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="ProductStripe not found")
    return item

@router.post("/", response_model=ProductStripe)
def create_product_stripe(data: ProductStripe):
    created = product_stripe_service.create_product_stripe(data.dict())
    return ProductStripe(**created)

@router.patch("/{id}", response_model=ProductStripe)
def update_product_stripe(id: int, data: ProductStripe):
    updated = product_stripe_service.update_product_stripe(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="ProductStripe not found")
    return ProductStripe(**updated)

@router.delete("/{id}")
def delete_product_stripe(id: int):
    product_stripe_service.delete_product_stripe(id)
    return {"deleted": True}
