from fastapi import APIRouter, HTTPException
from typing import Optional
from app.schemas.import_job import ImportJob
from app.services import import_job_service

router = APIRouter(prefix="/import_job", tags=["ImportJob"])

@router.get("/", response_model=list[ImportJob])
def list_import_job(
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
    return import_job_service.get_all_import_job(filters, limit=limit, page=page)

@router.get("/{id}", response_model=ImportJob)
def get_import_job(id: UUID):
    item = import_job_service.get_import_job_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="ImportJob not found")
    return item

@router.post("/", response_model=ImportJob)
def create_import_job(data: ImportJob):
    created = import_job_service.create_import_job(data.dict())
    return ImportJob(**created)

@router.patch("/{id}", response_model=ImportJob)
def update_import_job(id: int, data: ImportJob):
    updated = import_job_service.update_import_job(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="ImportJob not found")
    return ImportJob(**updated)

@router.delete("/{id}")
def delete_import_job(id: UUID):
    import_job_service.delete_import_job(id)
    return {"deleted": True}
