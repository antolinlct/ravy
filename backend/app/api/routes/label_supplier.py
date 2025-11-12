from fastapi import APIRouter, HTTPException
from app.schemas.label_supplier import LabelSupplier
from app.services import label_supplier_service

router = APIRouter(prefix="/label_supplier", tags=["LabelSupplier"])

@router.get("/", response_model=list[LabelSupplier])
def list_label_supplier(
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
    return label_supplier_service.get_all_label_supplier(filters, limit=limit, page=page)

@router.get("/{id}", response_model=LabelSupplier)
def get_label_supplier(id: int):
    item = label_supplier_service.get_label_supplier_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="LabelSupplier not found")
    return item

@router.post("/", response_model=LabelSupplier)
def create_label_supplier(data: LabelSupplier):
    created = label_supplier_service.create_label_supplier(data.dict())
    return LabelSupplier(**created)

@router.patch("/{id}", response_model=LabelSupplier)
def update_label_supplier(id: int, data: LabelSupplier):
    updated = label_supplier_service.update_label_supplier(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="LabelSupplier not found")
    return LabelSupplier(**updated)

@router.delete("/{id}")
def delete_label_supplier(id: int):
    label_supplier_service.delete_label_supplier(id)
    return {"deleted": True}
