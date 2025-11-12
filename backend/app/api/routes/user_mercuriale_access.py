from fastapi import APIRouter, HTTPException
from app.schemas.user_mercuriale_access import UserMercurialeAccess
from app.services import user_mercuriale_access_service

router = APIRouter(prefix="/user_mercuriale_access", tags=["UserMercurialeAccess"])

@router.get("/", response_model=list[UserMercurialeAccess])
def list_user_mercuriale_access(
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
    return user_mercuriale_access_service.get_all_user_mercuriale_access(filters, limit=limit, page=page)

@router.get("/{id}", response_model=UserMercurialeAccess)
def get_user_mercuriale_access(id: int):
    item = user_mercuriale_access_service.get_user_mercuriale_access_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="UserMercurialeAccess not found")
    return item

@router.post("/", response_model=UserMercurialeAccess)
def create_user_mercuriale_access(data: UserMercurialeAccess):
    created = user_mercuriale_access_service.create_user_mercuriale_access(data.dict())
    return UserMercurialeAccess(**created)

@router.patch("/{id}", response_model=UserMercurialeAccess)
def update_user_mercuriale_access(id: int, data: UserMercurialeAccess):
    updated = user_mercuriale_access_service.update_user_mercuriale_access(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="UserMercurialeAccess not found")
    return UserMercurialeAccess(**updated)

@router.delete("/{id}")
def delete_user_mercuriale_access(id: int):
    user_mercuriale_access_service.delete_user_mercuriale_access(id)
    return {"deleted": True}
