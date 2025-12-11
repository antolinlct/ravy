from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.alert_logs import AlertLogs
from app.services import alert_logs_service

router = APIRouter(prefix="/alert_logs", tags=["AlertLogs"])

@router.get("/", response_model=list[AlertLogs])
def list_alert_logs(
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
    return alert_logs_service.get_all_alert_logs(filters, limit=limit, page=page)

@router.get("/{id}", response_model=AlertLogs)
def get_alert_logs(id: UUID):
    item = alert_logs_service.get_alert_logs_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="AlertLogs not found")
    return item

@router.post("/", response_model=AlertLogs)
def create_alert_logs(data: AlertLogs):
    payload = jsonable_encoder(data.dict())
    created = alert_logs_service.create_alert_logs(payload)
    return AlertLogs(**created)

@router.patch("/{id}", response_model=AlertLogs)
def update_alert_logs(id: UUID, data: AlertLogs):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = alert_logs_service.update_alert_logs(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="AlertLogs not found")
    return AlertLogs(**updated)

@router.delete("/{id}")
def delete_alert_logs(id: UUID):
    alert_logs_service.delete_alert_logs(id)
    return {"deleted": True}
