from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.vat_rates import VatRates
from app.services import vat_rates_service

router = APIRouter(prefix="/vat_rates", tags=["VatRates"])

@router.get("/", response_model=list[VatRates])
def list_vat_rates(
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
    return vat_rates_service.get_all_vat_rates(filters, limit=limit, page=page)

@router.get("/{id}", response_model=VatRates)
def get_vat_rates(id: UUID):
    item = vat_rates_service.get_vat_rates_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="VatRates not found")
    return item

@router.post("/", response_model=VatRates)
def create_vat_rates(data: VatRates):
    created = vat_rates_service.create_vat_rates(data.dict())
    return VatRates(**created)

@router.patch("/{id}", response_model=VatRates)
def update_vat_rates(id: int, data: VatRates):
    updated = vat_rates_service.update_vat_rates(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="VatRates not found")
    return VatRates(**updated)

@router.delete("/{id}")
def delete_vat_rates(id: UUID):
    vat_rates_service.delete_vat_rates(id)
    return {"deleted": True}
