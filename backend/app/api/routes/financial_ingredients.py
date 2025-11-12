from fastapi import APIRouter, HTTPException
from app.schemas.financial_ingredients import FinancialIngredients
from app.services import financial_ingredients_service

router = APIRouter(prefix="/financial_ingredients", tags=["FinancialIngredients"])

@router.get("/", response_model=list[FinancialIngredients])
def list_financial_ingredients(
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
    return financial_ingredients_service.get_all_financial_ingredients(filters, limit=limit, page=page)

@router.get("/{id}", response_model=FinancialIngredients)
def get_financial_ingredients(id: int):
    item = financial_ingredients_service.get_financial_ingredients_by_id(id)
    if not item:
        raise HTTPException(status_code=404, detail="FinancialIngredients not found")
    return item

@router.post("/", response_model=FinancialIngredients)
def create_financial_ingredients(data: FinancialIngredients):
    created = financial_ingredients_service.create_financial_ingredients(data.dict())
    return FinancialIngredients(**created)

@router.patch("/{id}", response_model=FinancialIngredients)
def update_financial_ingredients(id: int, data: FinancialIngredients):
    updated = financial_ingredients_service.update_financial_ingredients(id, data.dict(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="FinancialIngredients not found")
    return FinancialIngredients(**updated)

@router.delete("/{id}")
def delete_financial_ingredients(id: int):
    financial_ingredients_service.delete_financial_ingredients(id)
    return {"deleted": True}
