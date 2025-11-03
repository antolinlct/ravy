from fastapi import APIRouter, HTTPException
from app.schemas.establishment_settings import EstablishmentSettings
from app.services import establishment_settings_service

router = APIRouter(prefix="/establishment_settings", tags=["EstablishmentSettings"])

@router.get("/", response_model=list[EstablishmentSettings])
def list_establishment_settings(order_by: str | None = None, direction: str | None = None):
    filters = {"order_by": order_by, "direction": direction}
    filters = {k: v for k, v in filters.items() if v is not None}
    return establishment_settings_service.get_all_establishment_settings(filters)

@router.get("/{id}", response_model=EstablishmentSettings)
def get_establishment_settings(id: int):
    item = establishment_settings_service.get_establishment_settings_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="EstablishmentSettings not found")
    return item

@router.post("/", response_model=EstablishmentSettings)
def create_establishment_settings(data: EstablishmentSettings):
    created = establishment_settings_service.create_establishment_settings(data.dict())
    return EstablishmentSettings(**created)

@router.patch("/{id}", response_model=EstablishmentSettings)
def update_establishment_settings(id: int, data: EstablishmentSettings):
    updated = establishment_settings_service.update_establishment_settings(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="EstablishmentSettings not found")
    return EstablishmentSettings(**updated)

@router.delete("/{id}")
def delete_establishment_settings(id: int):
    establishment_settings_service.delete_establishment_settings(id)
    return {"deleted": True}
