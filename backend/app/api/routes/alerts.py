from fastapi import APIRouter, HTTPException
from app.schemas.alerts import Alerts
from app.services import alerts_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("/", response_model=list[Alerts])
def list_alerts(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return alerts_service.get_all_alerts(filters)

@router.get("/{id}", response_model=Alerts)
def get_alerts(id: int):
    item = alerts_service.get_alerts_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="Alerts not found")
    return item

@router.post("/", response_model=Alerts)
def create_alerts(data: Alerts):
    created = alerts_service.create_alerts(data.dict())
    return Alerts(**created)

@router.patch("/{id}", response_model=Alerts)
def update_alerts(id: int, data: Alerts):
    updated = alerts_service.update_alerts(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Alerts not found")
    return Alerts(**updated)

@router.delete("/{id}")
def delete_alerts(id: int):
    alerts_service.delete_alerts(id)
    return {"deleted": True}
