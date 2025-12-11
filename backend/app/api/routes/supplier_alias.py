from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.supplier_alias import SupplierAlias
from app.services import supplier_alias_service

router = APIRouter(prefix="/supplier_alias", tags=["SupplierAlias"])

@router.get("/", response_model=list[SupplierAlias])
def list_supplier_alias(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None,
    supplier_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id, "supplier_id": supplier_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return supplier_alias_service.get_all_supplier_alias(filters, limit=limit, page=page)

@router.get("/{id}", response_model=SupplierAlias)
def get_supplier_alias(id: UUID):
    item = supplier_alias_service.get_supplier_alias_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="SupplierAlias not found")
    return item

@router.post("/", response_model=SupplierAlias)
def create_supplier_alias(data: SupplierAlias):
    created = supplier_alias_service.create_supplier_alias(data.dict())
    return SupplierAlias(**created)

@router.patch("/{id}", response_model=SupplierAlias)
def update_supplier_alias(id: int, data: SupplierAlias):
    updated = supplier_alias_service.update_supplier_alias(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="SupplierAlias not found")
    return SupplierAlias(**updated)

@router.delete("/{id}")
def delete_supplier_alias(id: UUID):
    supplier_alias_service.delete_supplier_alias(id)
    return {"deleted": True}
