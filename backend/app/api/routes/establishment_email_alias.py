from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.establishment_email_alias import EstablishmentEmailAlias
from app.services import establishment_email_alias_service

router = APIRouter(prefix="/establishment_email_alias", tags=["EstablishmentEmailAlias"])

@router.get("/", response_model=list[EstablishmentEmailAlias])
def list_establishment_email_alias(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1,
    establishment_id: Optional[str] = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return establishment_email_alias_service.get_all_establishment_email_alias(filters, limit=limit, page=page)

@router.get("/{id}", response_model=EstablishmentEmailAlias)
def get_establishment_email_alias(id: UUID):
    item = establishment_email_alias_service.get_establishment_email_alias_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="EstablishmentEmailAlias not found")
    return item

@router.post("/", response_model=EstablishmentEmailAlias)
def create_establishment_email_alias(data: EstablishmentEmailAlias):
    payload = jsonable_encoder(data.dict())
    created = establishment_email_alias_service.create_establishment_email_alias(payload)
    return EstablishmentEmailAlias(**created)

@router.patch("/{id}", response_model=EstablishmentEmailAlias)
def update_establishment_email_alias(id: UUID, data: EstablishmentEmailAlias):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = establishment_email_alias_service.update_establishment_email_alias(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="EstablishmentEmailAlias not found")
    return EstablishmentEmailAlias(**updated)

@router.delete("/{id}")
def delete_establishment_email_alias(id: UUID):
    establishment_email_alias_service.delete_establishment_email_alias(id)
    return {"deleted": True}
