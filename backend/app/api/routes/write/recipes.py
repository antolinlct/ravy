from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.logic.write.delete_recipes import LogicError as DeleteRecipeError, delete_recipe
from app.logic.write.recipe_duplication import LogicError as DuplicateRecipeError, duplicate_recipe
from app.logic.write.update_recipes import LogicError as UpdateRecipeError, update_recipe


router = APIRouter()


class DeleteRecipeRequest(BaseModel):
    recipe_id: UUID
    establishment_id: UUID
    target_date: Optional[date] = None


@router.post("/delete-recipe")
def delete_recipe_endpoint(payload: DeleteRecipeRequest):
    try:
        return delete_recipe(**payload.model_dump())
    except DeleteRecipeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class UpdateRecipeRequest(BaseModel):
    recipe_id: UUID
    establishment_id: UUID
    target_date: Optional[date] = None


@router.post("/update-recipe")
def update_recipe_endpoint(payload: UpdateRecipeRequest):
    try:
        return update_recipe(**payload.model_dump())
    except UpdateRecipeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class DuplicateRecipeRequest(BaseModel):
    recipe_id: UUID
    establishment_id: UUID
    new_name: str
    target_date: Optional[date] = None


@router.post("/duplicate-recipe")
def duplicate_recipe_endpoint(payload: DuplicateRecipeRequest):
    try:
        return duplicate_recipe(**payload.model_dump())
    except DuplicateRecipeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))