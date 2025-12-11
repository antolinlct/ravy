from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.messages_ia import MessagesIa
from app.services import messages_ia_service

router = APIRouter(prefix="/messages_ia", tags=["MessagesIa"])

@router.get("/", response_model=list[MessagesIa])
def list_messages_ia(
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
    return messages_ia_service.get_all_messages_ia(filters, limit=limit, page=page)

@router.get("/{id}", response_model=MessagesIa)
def get_messages_ia(id: UUID):
    item = messages_ia_service.get_messages_ia_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="MessagesIa not found")
    return item

@router.post("/", response_model=MessagesIa)
def create_messages_ia(data: MessagesIa):
    created = messages_ia_service.create_messages_ia(data.dict())
    return MessagesIa(**created)

@router.patch("/{id}", response_model=MessagesIa)
def update_messages_ia(id: int, data: MessagesIa):
    updated = messages_ia_service.update_messages_ia(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="MessagesIa not found")
    return MessagesIa(**updated)

@router.delete("/{id}")
def delete_messages_ia(id: UUID):
    messages_ia_service.delete_messages_ia(id)
    return {"deleted": True}
