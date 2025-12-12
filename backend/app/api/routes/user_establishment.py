from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.user_establishment import UserEstablishment
from app.services import user_establishment_service

router = APIRouter(prefix="/user_establishment", tags=["UserEstablishment"])

@router.get("/", response_model=list[UserEstablishment])
def list_user_establishment(
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
    return user_establishment_service.get_all_user_establishment(filters, limit=limit, page=page)

@router.get("/{id}", response_model=UserEstablishment)
def get_user_establishment(id: UUID):
    item = user_establishment_service.get_user_establishment_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="UserEstablishment not found")
    return item

@router.post("/", response_model=UserEstablishment)
def create_user_establishment(data: UserEstablishment):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = user_establishment_service.create_user_establishment(payload)
    return UserEstablishment(**created)

@router.patch("/{id}", response_model=UserEstablishment)
def update_user_establishment(id: UUID, data: UserEstablishment):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = user_establishment_service.update_user_establishment(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="UserEstablishment not found")
    return UserEstablishment(**updated)

@router.delete("/{id}")
def delete_user_establishment(id: UUID):
    user_establishment_service.delete_user_establishment(id)
    return {"deleted": True}
