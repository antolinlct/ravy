from datetime import date
from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.logic.write.delete_article import LogicError as DeleteArticleError, delete_article
from app.logic.write.edit_article import LogicError as EditArticleError, edit_article


router = APIRouter()


class DeleteArticleRequest(BaseModel):
    establishment_id: UUID
    invoice_id: UUID
    invoice_date: date
    master_article_id: UUID
    supplier_id: UUID
    id_article_to_delete: UUID


@router.post("/delete-article")
def delete_article_endpoint(payload: DeleteArticleRequest):
    try:
        return delete_article(**payload.model_dump())
    except DeleteArticleError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class EditArticleRequest(BaseModel):
    establishment_id: UUID
    invoice_id: UUID
    master_article_id: UUID
    invoice_date: date
    article_id: UUID
    article_unit: str
    article_quantity: Any
    article_gross_unit_price: Any
    article_new_unit_price: Any
    article_old_unit_price: Any
    article_total: Any
    article_discounts: Any
    article_duties_and_taxes: Any


@router.post("/edit-article")
def edit_article_endpoint(payload: EditArticleRequest):
    try:
        return edit_article(**payload.model_dump())
    except EditArticleError as exc:
        raise HTTPException(status_code=400, detail=str(exc))