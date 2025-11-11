from fastapi import APIRouter, HTTPException
from app.schemas.product import Product
from app.services import product_service

router = APIRouter(prefix="/product", tags=["Product"])

@router.get("/", response_model=list[Product])
def list_product(
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
    return product_service.get_all_product(filters)

@router.get("/{id}", response_model=Product)
def get_product(id: int):
    item = product_service.get_product_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Product not found")
    return item

@router.post("/", response_model=Product)
def create_product(data: Product):
    created = product_service.create_product(data.dict())
    return Product(**created)

@router.patch("/{id}", response_model=Product)
def update_product(id: int, data: Product):
    updated = product_service.update_product(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**updated)

@router.delete("/{id}")
def delete_product(id: int):
    product_service.delete_product(id)
    return {"deleted": True}
