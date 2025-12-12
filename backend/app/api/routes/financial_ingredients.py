from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.encoders import jsonable_encoder
from typing import Optional
from app.schemas.financial_ingredients import FinancialIngredients
from app.services import financial_ingredients_service

router = APIRouter(prefix="/financial_ingredients", tags=["FinancialIngredients"])

@router.get("/", response_model=list[FinancialIngredients])
def list_financial_ingredients(
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
    return financial_ingredients_service.get_all_financial_ingredients(filters, limit=limit, page=page)

@router.get("/{id}", response_model=FinancialIngredients)
def get_financial_ingredients(id: UUID):
    item = financial_ingredients_service.get_financial_ingredients_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="FinancialIngredients not found")
    return item

@router.post("/", response_model=FinancialIngredients)
def create_financial_ingredients(data: FinancialIngredients):
    payload = jsonable_encoder(data.dict(exclude={"id"}))
    created = financial_ingredients_service.create_financial_ingredients(payload)
    return FinancialIngredients(**created)

@router.patch("/{id}", response_model=FinancialIngredients)
def update_financial_ingredients(id: UUID, data: FinancialIngredients):
    payload = jsonable_encoder(data.dict(exclude_unset=True))
    updated = financial_ingredients_service.update_financial_ingredients(id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="FinancialIngredients not found")
    return FinancialIngredients(**updated)

@router.delete("/{id}")
def delete_financial_ingredients(id: UUID):
    financial_ingredients_service.delete_financial_ingredients(id)
    return {"deleted": True}
