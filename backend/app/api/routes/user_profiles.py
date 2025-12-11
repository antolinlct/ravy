from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.user_profiles import UserProfiles
from app.services import user_profiles_service

router = APIRouter(prefix="/user_profiles", tags=["UserProfiles"])

@router.get("/", response_model=list[UserProfiles])
def list_user_profiles(
    order_by: Optional[str] = None,
    direction: Optional[str] = None,
    limit: Optional[int] = 200,
    page: Optional[int] = 1
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return user_profiles_service.get_all_user_profiles(filters, limit=limit, page=page)

@router.get("/{id}", response_model=UserProfiles)
def get_user_profiles(id: UUID):
    item = user_profiles_service.get_user_profiles_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="UserProfiles not found")
    return item

@router.post("/", response_model=UserProfiles)
def create_user_profiles(data: UserProfiles):
    created = user_profiles_service.create_user_profiles(data.dict())
    return UserProfiles(**created)

@router.patch("/{id}", response_model=UserProfiles)
def update_user_profiles(id: int, data: UserProfiles):
    updated = user_profiles_service.update_user_profiles(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="UserProfiles not found")
    return UserProfiles(**updated)

@router.delete("/{id}")
def delete_user_profiles(id: UUID):
    user_profiles_service.delete_user_profiles(id)
    return {"deleted": True}
