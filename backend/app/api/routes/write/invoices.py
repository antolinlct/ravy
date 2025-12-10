from datetime import date
from typing import Optional, Sequence
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.logic.write.delete_invoices import LogicError as DeleteInvoiceError, delete_invoice
from app.logic.write.import_manual_invoices import (
    LogicError as ManualInvoiceLogicError,
    apply_manual_invoice_effects,
)


router = APIRouter()


class DeleteInvoiceRequest(BaseModel):
    establishment_id: UUID
    invoice_to_delete_id: UUID
    invoice_to_delete_date: date
    supplier_id: UUID


@router.post("/delete-invoice")
def delete_invoice_endpoint(payload: DeleteInvoiceRequest):
    try:
        return delete_invoice(**payload.model_dump())
    except DeleteInvoiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


class ManualInvoiceEffectsRequest(BaseModel):
    establishment_id: UUID
    invoice_date: date
    master_article_ids: Sequence[UUID]
    invoice_id: Optional[UUID] = None


@router.post("/manual-invoice-effects")
def manual_invoice_effects_endpoint(payload: ManualInvoiceEffectsRequest):
    try:
        return apply_manual_invoice_effects(**payload.model_dump())
    except ManualInvoiceLogicError as exc:
        raise HTTPException(status_code=400, detail=str(exc))