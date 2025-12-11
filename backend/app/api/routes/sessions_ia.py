from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.sessions_ia import SessionsIa
from app.services import sessions_ia_service

router = APIRouter(prefix="/sessions_ia", tags=["SessionsIa"])

@router.get("/", response_model=list[SessionsIa])
def list_sessions_ia(
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
    return sessions_ia_service.get_all_sessions_ia(filters, limit=limit, page=page)

@router.get("/{id}", response_model=SessionsIa)
def get_sessions_ia(id: UUID):
    item = sessions_ia_service.get_sessions_ia_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="SessionsIa not found")
    return item

@router.post("/", response_model=SessionsIa)
def create_sessions_ia(data: SessionsIa):
    payload = jsonable_encoder(data.dict())
    created = sessions_ia_service.create_sessions_ia(payload)
    return SessionsIa(**created)

@router.patch("/{id}", response_model=SessionsIa)
def update_sessions_ia(id: UUID, data: SessionsIa):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = sessions_ia_service.update_sessions_ia(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="SessionsIa not found")
    return SessionsIa(**updated)

@router.delete("/{id}")
def delete_sessions_ia(id: UUID):
    sessions_ia_service.delete_sessions_ia(id)
    return {"deleted": True}
