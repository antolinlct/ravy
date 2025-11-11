from fastapi import APIRouter, HTTPException
from app.schemas.sessions_ia import SessionsIa
from app.services import sessions_ia_service

router = APIRouter(prefix="/sessions_ia", tags=["SessionsIa"])

@router.get("/", response_model=list[SessionsIa])
def list_sessions_ia(
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
    return sessions_ia_service.get_all_sessions_ia(filters)

@router.get("/{id}", response_model=SessionsIa)
def get_sessions_ia(id: int):
    item = sessions_ia_service.get_sessions_ia_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="SessionsIa not found")
    return item

@router.post("/", response_model=SessionsIa)
def create_sessions_ia(data: SessionsIa):
    created = sessions_ia_service.create_sessions_ia(data.dict())
    return SessionsIa(**created)

@router.patch("/{id}", response_model=SessionsIa)
def update_sessions_ia(id: int, data: SessionsIa):
    updated = sessions_ia_service.update_sessions_ia(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="SessionsIa not found")
    return SessionsIa(**updated)

@router.delete("/{id}")
def delete_sessions_ia(id: int):
    sessions_ia_service.delete_sessions_ia(id)
    return {"deleted": True}
