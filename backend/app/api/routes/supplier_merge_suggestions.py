from fastapi import APIRouter, HTTPException
from app.schemas.supplier_merge_suggestions import SupplierMergeSuggestions
from app.services import supplier_merge_suggestions_service

router = APIRouter(prefix="/supplier_merge_suggestions", tags=["SupplierMergeSuggestions"])

@router.get("/", response_model=list[SupplierMergeSuggestions])
def list_supplier_merge_suggestions(
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
    return supplier_merge_suggestions_service.get_all_supplier_merge_suggestions(filters)

@router.get("/{id}", response_model=SupplierMergeSuggestions)
def get_supplier_merge_suggestions(id: int):
    item = supplier_merge_suggestions_service.get_supplier_merge_suggestions_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="SupplierMergeSuggestions not found")
    return item

@router.post("/", response_model=SupplierMergeSuggestions)
def create_supplier_merge_suggestions(data: SupplierMergeSuggestions):
    created = supplier_merge_suggestions_service.create_supplier_merge_suggestions(data.dict())
    return SupplierMergeSuggestions(**created)

@router.patch("/{id}", response_model=SupplierMergeSuggestions)
def update_supplier_merge_suggestions(id: int, data: SupplierMergeSuggestions):
    updated = supplier_merge_suggestions_service.update_supplier_merge_suggestions(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="SupplierMergeSuggestions not found")
    return SupplierMergeSuggestions(**updated)

@router.delete("/{id}")
def delete_supplier_merge_suggestions(id: int):
    supplier_merge_suggestions_service.delete_supplier_merge_suggestions(id)
    return {"deleted": True}
