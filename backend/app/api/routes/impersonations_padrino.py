from fastapi import APIRouter, HTTPException
from app.schemas.impersonations_padrino import ImpersonationsPadrino
from app.services import impersonations_padrino_service

router = APIRouter(prefix="/impersonations_padrino", tags=["ImpersonationsPadrino"])

@router.get("/", response_model=list[ImpersonationsPadrino])
def list_impersonations_padrino(
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
    return impersonations_padrino_service.get_all_impersonations_padrino(filters, limit=limit, page=page)

@router.get("/{id}", response_model=ImpersonationsPadrino)
def get_impersonations_padrino(id: int):
    item = impersonations_padrino_service.get_impersonations_padrino_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="ImpersonationsPadrino not found")
    return item

@router.post("/", response_model=ImpersonationsPadrino)
def create_impersonations_padrino(data: ImpersonationsPadrino):
    created = impersonations_padrino_service.create_impersonations_padrino(data.dict())
    return ImpersonationsPadrino(**created)

@router.patch("/{id}", response_model=ImpersonationsPadrino)
def update_impersonations_padrino(id: int, data: ImpersonationsPadrino):
    updated = impersonations_padrino_service.update_impersonations_padrino(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="ImpersonationsPadrino not found")
    return ImpersonationsPadrino(**updated)

@router.delete("/{id}")
def delete_impersonations_padrino(id: int):
    impersonations_padrino_service.delete_impersonations_padrino(id)
    return {"deleted": True}
