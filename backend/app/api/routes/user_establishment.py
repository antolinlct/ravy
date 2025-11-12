from fastapi import APIRouter, HTTPException
from app.schemas.user_establishment import UserEstablishment
from app.services import user_establishment_service

router = APIRouter(prefix="/user_establishment", tags=["UserEstablishment"])

@router.get("/", response_model=list[UserEstablishment])
def list_user_establishment(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = 200,
    page: int | None = 1,
    establishment_id: str | None = None
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
def get_user_establishment(id: int):
    item = user_establishment_service.get_user_establishment_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="UserEstablishment not found")
    return item

@router.post("/", response_model=UserEstablishment)
def create_user_establishment(data: UserEstablishment):
    created = user_establishment_service.create_user_establishment(data.dict())
    return UserEstablishment(**created)

@router.patch("/{id}", response_model=UserEstablishment)
def update_user_establishment(id: int, data: UserEstablishment):
    updated = user_establishment_service.update_user_establishment(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="UserEstablishment not found")
    return UserEstablishment(**updated)

@router.delete("/{id}")
def delete_user_establishment(id: int):
    user_establishment_service.delete_user_establishment(id)
    return {"deleted": True}
