from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.financial_recipes import FinancialRecipes
from app.services import financial_recipes_service

router = APIRouter(prefix="/financial_recipes", tags=["FinancialRecipes"])

@router.get("/", response_model=list[FinancialRecipes])
def list_financial_recipes(
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
    return financial_recipes_service.get_all_financial_recipes(filters, limit=limit, page=page)

@router.get("/{id}", response_model=FinancialRecipes)
def get_financial_recipes(id: UUID):
    item = financial_recipes_service.get_financial_recipes_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="FinancialRecipes not found")
    return item

@router.post("/", response_model=FinancialRecipes)
def create_financial_recipes(data: FinancialRecipes):
    payload = jsonable_encoder(data.dict())
    created = financial_recipes_service.create_financial_recipes(payload)
    return FinancialRecipes(**created)

@router.patch("/{id}", response_model=FinancialRecipes)
def update_financial_recipes(id: UUID, data: FinancialRecipes):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = financial_recipes_service.update_financial_recipes(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="FinancialRecipes not found")
    return FinancialRecipes(**updated)

@router.delete("/{id}")
def delete_financial_recipes(id: UUID):
    financial_recipes_service.delete_financial_recipes(id)
    return {"deleted": True}
