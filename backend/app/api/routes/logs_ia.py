from fastapi import APIRouter, HTTPException
from app.schemas.logs_ia import LogsIa
from app.services import logs_ia_service

router = APIRouter(prefix="/logs_ia", tags=["LogsIa"])

@router.get("/", response_model=list[LogsIa])
def list_logs_ia(
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
    return logs_ia_service.get_all_logs_ia(filters, limit=limit, page=page)

@router.get("/{id}", response_model=LogsIa)
def get_logs_ia(id: int):
    item = logs_ia_service.get_logs_ia_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="LogsIa not found")
    return item

@router.post("/", response_model=LogsIa)
def create_logs_ia(data: LogsIa):
    created = logs_ia_service.create_logs_ia(data.dict())
    return LogsIa(**created)

@router.patch("/{id}", response_model=LogsIa)
def update_logs_ia(id: int, data: LogsIa):
    updated = logs_ia_service.update_logs_ia(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="LogsIa not found")
    return LogsIa(**updated)

@router.delete("/{id}")
def delete_logs_ia(id: int):
    logs_ia_service.delete_logs_ia(id)
    return {"deleted": True}
