from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.logs import Logs
from app.services import logs_service

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("/", response_model=list[Logs])
def list_logs(
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
    return logs_service.get_all_logs(filters, limit=limit, page=page)

@router.get("/{id}", response_model=Logs)
def get_logs(id: int):
    item = logs_service.get_logs_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Logs not found")
    return item

@router.post("/", response_model=Logs)
def create_logs(data: Logs):
    created = logs_service.create_logs(data.dict())
    return Logs(**created)

@router.patch("/{id}", response_model=Logs)
def update_logs(id: int, data: Logs):
    updated = logs_service.update_logs(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Logs not found")
    return Logs(**updated)

@router.delete("/{id}")
def delete_logs(id: int):
    logs_service.delete_logs(id)
    return {"deleted": True}
