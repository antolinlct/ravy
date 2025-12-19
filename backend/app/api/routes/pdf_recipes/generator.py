from __future__ import annotations

import io
from typing import List, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.logic.pdf_recipes.generator import render_recipe_pdf
from app.schemas.recipes import Recipes


class PDFIngredient(BaseModel):
  name: Optional[str] = None
  type: Optional[str] = Field(None, description="ARTICLE | SUBRECIPE | FIXED")
  quantity: Optional[float] = None
  unit: Optional[str] = None
  unit_cost: Optional[float] = None
  supplier: Optional[str] = None
  product: Optional[str] = None


class RecipePDFPayload(BaseModel):
  recipe: Recipes
  ingredients: List[PDFIngredient] = Field(default_factory=list)
  include_financials: bool = True
  technical_image_url: Optional[str] = None


router = APIRouter(prefix="/pdf/recipes", tags=["PDF Recipes"])


@router.post("/generate", response_class=StreamingResponse)
def generate_recipe_pdf(payload: RecipePDFPayload):
  pdf_bytes = render_recipe_pdf(
    recipe=payload.recipe,
    ingredients=[ing.dict(exclude_none=True) for ing in payload.ingredients],
    include_financials=payload.include_financials,
    technical_image_url=payload.technical_image_url,
  )

  filename = f"{payload.recipe.name or 'fiche-technique'}.pdf"
  stream = io.BytesIO(pdf_bytes)
  headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
  return StreamingResponse(stream, media_type="application/pdf", headers=headers)
