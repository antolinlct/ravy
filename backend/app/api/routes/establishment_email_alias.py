from fastapi import APIRouter, HTTPException
from app.schemas.establishment_email_alias import EstablishmentEmailAlias
from app.services import establishment_email_alias_service

router = APIRouter(prefix="/establishment_email_alias", tags=["EstablishmentEmailAlias"])

@router.get("/", response_model=list[EstablishmentEmailAlias])
def list_establishment_email_alias(
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
    return establishment_email_alias_service.get_all_establishment_email_alias(filters)

@router.get("/{id}", response_model=EstablishmentEmailAlias)
def get_establishment_email_alias(id: int):
    item = establishment_email_alias_service.get_establishment_email_alias_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="EstablishmentEmailAlias not found")
    return item

@router.post("/", response_model=EstablishmentEmailAlias)
def create_establishment_email_alias(data: EstablishmentEmailAlias):
    created = establishment_email_alias_service.create_establishment_email_alias(data.dict())
    return EstablishmentEmailAlias(**created)

@router.patch("/{id}", response_model=EstablishmentEmailAlias)
def update_establishment_email_alias(id: int, data: EstablishmentEmailAlias):
    updated = establishment_email_alias_service.update_establishment_email_alias(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="EstablishmentEmailAlias not found")
    return EstablishmentEmailAlias(**updated)

@router.delete("/{id}")
def delete_establishment_email_alias(id: int):
    establishment_email_alias_service.delete_establishment_email_alias(id)
    return {"deleted": True}
