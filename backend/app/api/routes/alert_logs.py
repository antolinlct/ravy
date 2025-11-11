from fastapi import APIRouter, HTTPException
from app.schemas.alert_logs import AlertLogs
from app.services import alert_logs_service

router = APIRouter(prefix="/alert_logs", tags=["AlertLogs"])

@router.get("/", response_model=list[AlertLogs])
def list_alert_logs(
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
    return alert_logs_service.get_all_alert_logs(filters)

@router.get("/{id}", response_model=AlertLogs)
def get_alert_logs(id: int):
    item = alert_logs_service.get_alert_logs_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="AlertLogs not found")
    return item

@router.post("/", response_model=AlertLogs)
def create_alert_logs(data: AlertLogs):
    created = alert_logs_service.create_alert_logs(data.dict())
    return AlertLogs(**created)

@router.patch("/{id}", response_model=AlertLogs)
def update_alert_logs(id: int, data: AlertLogs):
    updated = alert_logs_service.update_alert_logs(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="AlertLogs not found")
    return AlertLogs(**updated)

@router.delete("/{id}")
def delete_alert_logs(id: int):
    alert_logs_service.delete_alert_logs(id)
    return {"deleted": True}
