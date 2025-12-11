from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.mercurial_request import MercurialRequest
from app.services import mercurial_request_service

router = APIRouter(prefix="/mercurial_request", tags=["MercurialRequest"])

@router.get("/", response_model=list[MercurialRequest])
def list_mercurial_request(
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
    return mercurial_request_service.get_all_mercurial_request(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MercurialRequest)
def get_mercurial_request(id: UUID):
    item = mercurial_request_service.get_mercurial_request_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MercurialRequest not found")
    return item

@router.post("/", response_model=MercurialRequest)
def create_mercurial_request(data: MercurialRequest):
    payload = jsonable_encoder(data.dict())
    created = mercurial_request_service.create_mercurial_request(payload)
    return MercurialRequest(**created)

@router.patch("/{id}", response_model=MercurialRequest)
def update_mercurial_request(id: UUID, data: MercurialRequest):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = mercurial_request_service.update_mercurial_request(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="MercurialRequest not found")
    return MercurialRequest(**updated)

@router.delete("/{id}")
def delete_mercurial_request(id: UUID):
    mercurial_request_service.delete_mercurial_request(id)
    return {"deleted": True}
