from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.market_suppliers import MarketSuppliers
from app.services import market_suppliers_service

router = APIRouter(prefix="/market_suppliers", tags=["MarketSuppliers"])

@router.get("/", response_model=list[MarketSuppliers])
def list_market_suppliers(
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
    return market_suppliers_service.get_all_market_suppliers(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MarketSuppliers)
def get_market_suppliers(id: UUID):
    item = market_suppliers_service.get_market_suppliers_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MarketSuppliers not found")
    return item

@router.post("/", response_model=MarketSuppliers)
def create_market_suppliers(data: MarketSuppliers):
    payload = jsonable_encoder(data.dict())
    created = market_suppliers_service.create_market_suppliers(payload)
    return MarketSuppliers(**created)

@router.patch("/{id}", response_model=MarketSuppliers)
def update_market_suppliers(id: UUID, data: MarketSuppliers):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = market_suppliers_service.update_market_suppliers(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="MarketSuppliers not found")
    return MarketSuppliers(**updated)

@router.delete("/{id}")
def delete_market_suppliers(id: UUID):
    market_suppliers_service.delete_market_suppliers(id)
    return {"deleted": True}
