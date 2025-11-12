from fastapi import APIRouter, HTTPException
from app.schemas.usage_counters import UsageCounters
from app.services import usage_counters_service

router = APIRouter(prefix="/usage_counters", tags=["UsageCounters"])

@router.get("/", response_model=list[UsageCounters])
def list_usage_counters(
    order_by: str | None = None,
    direction: str | None = None,
    limit: int | None = 200,
    page: int | None = 1,
    establishment_id: str | None = None
):
    filters = {
        "order_by": order_by,
        "direction": direction,
        "limit": limit,
        "page": page, "establishment_id": establishment_id
    }
    filters = {k: v for k, v in filters.items() if v is not None}
    return usage_counters_service.get_all_usage_counters(filters, limit=limit, page=page)

@router.get("/{id}", response_model=UsageCounters)
def get_usage_counters(id: int):
    item = usage_counters_service.get_usage_counters_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="UsageCounters not found")
    return item

@router.post("/", response_model=UsageCounters)
def create_usage_counters(data: UsageCounters):
    created = usage_counters_service.create_usage_counters(data.dict())
    return UsageCounters(**created)

@router.patch("/{id}", response_model=UsageCounters)
def update_usage_counters(id: int, data: UsageCounters):
    updated = usage_counters_service.update_usage_counters(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="UsageCounters not found")
    return UsageCounters(**updated)

@router.delete("/{id}")
def delete_usage_counters(id: int):
    usage_counters_service.delete_usage_counters(id)
    return {"deleted": True}
