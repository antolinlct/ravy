from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.logic.write.delete_ingredient import LogicError as DeleteIngredientError, delete_ingredient
from app.logic.write.update_ingredients import LogicError as UpdateIngredientError, update_ingredient


router = APIRouter()


class DeleteIngredientRequest(BaseModel):
    ingredient_id: UUID
    establishment_id: UUID
    target_date: Optional[date] = None


@router.post("/delete-ingredient")
def delete_ingredient_endpoint(payload: DeleteIngredientRequest):
    try:
        return delete_ingredient(**payload.model_dump())
    except DeleteIngredientError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class UpdateIngredientRequest(BaseModel):
    ingredient_id: UUID
    recipe_id: UUID
    establishment_id: UUID
    target_date: Optional[date] = None


@router.post("/update-ingredient")
def update_ingredient_endpoint(payload: UpdateIngredientRequest):
    try:
        return update_ingredient(**payload.model_dump())
    except UpdateIngredientError as exc:
        raise HTTPException(status_code=400, detail=str(exc))