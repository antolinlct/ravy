from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.market_supplier_alias import MarketSupplierAlias
from app.services import market_supplier_alias_service

router = APIRouter(prefix="/market_supplier_alias", tags=["MarketSupplierAlias"])

@router.get("/", response_model=list[MarketSupplierAlias])
def list_market_supplier_alias(
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
    return market_supplier_alias_service.get_all_market_supplier_alias(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MarketSupplierAlias)
def get_market_supplier_alias(id: UUID):
    item = market_supplier_alias_service.get_market_supplier_alias_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MarketSupplierAlias not found")
    return item

@router.post("/", response_model=MarketSupplierAlias)
def create_market_supplier_alias(data: MarketSupplierAlias):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = market_supplier_alias_service.create_market_supplier_alias(payload)
    return MarketSupplierAlias(**created)

@router.patch("/{id}", response_model=MarketSupplierAlias)
def update_market_supplier_alias(id: UUID, data: MarketSupplierAlias):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = market_supplier_alias_service.update_market_supplier_alias(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="MarketSupplierAlias not found")
    return MarketSupplierAlias(**updated)

@router.delete("/{id}")
def delete_market_supplier_alias(id: UUID):
    market_supplier_alias_service.delete_market_supplier_alias(id)
    return {"deleted": True}
