from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.supplier_merge_request import SupplierMergeRequest
from app.services import supplier_merge_request_service

router = APIRouter(prefix="/supplier_merge_request", tags=["SupplierMergeRequest"])

@router.get("/", response_model=list[SupplierMergeRequest])
def list_supplier_merge_request(
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
    return supplier_merge_request_service.get_all_supplier_merge_request(filters, limit=limit, page=page)

@router.get("/{id}", response_model=SupplierMergeRequest)
def get_supplier_merge_request(id: UUID):
    item = supplier_merge_request_service.get_supplier_merge_request_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="SupplierMergeRequest not found")
    return item

@router.post("/", response_model=SupplierMergeRequest)
def create_supplier_merge_request(data: SupplierMergeRequest):
    payload = jsonable_encoder(data.dict())
    created = supplier_merge_request_service.create_supplier_merge_request(payload)
    return SupplierMergeRequest(**created)

@router.patch("/{id}", response_model=SupplierMergeRequest)
def update_supplier_merge_request(id: UUID, data: SupplierMergeRequest):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = supplier_merge_request_service.update_supplier_merge_request(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="SupplierMergeRequest not found")
    return SupplierMergeRequest(**updated)

@router.delete("/{id}")
def delete_supplier_merge_request(id: UUID):
    supplier_merge_request_service.delete_supplier_merge_request(id)
    return {"deleted": True}
