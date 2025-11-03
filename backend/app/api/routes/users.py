from fastapi import APIRouter, HTTPException
from app.schemas.users import Users
from app.services import users_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=list[Users])
def list_users(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return users_service.get_all_users(filters)

@router.get("/{id}", response_model=Users)
def get_users(id: int):
    item = users_service.get_users_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Users not found")
    return item

@router.post("/", response_model=Users)
def create_users(data: Users):
    created = users_service.create_users(data.dict())
    return Users(**created)

@router.patch("/{id}", response_model=Users)
def update_users(id: int, data: Users):
    updated = users_service.update_users(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Users not found")
    return Users(**updated)

@router.delete("/{id}")
def delete_users(id: int):
    users_service.delete_users(id)
    return {"deleted": True}
