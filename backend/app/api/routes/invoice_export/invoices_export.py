from io import BytesIO
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.logic.invoice_export.export_invoices import ExportError, export_invoices

router = APIRouter(
    prefix="/invoices",
    tags=["Invoices - Export"]
)


class InvoiceExportRequest(BaseModel):
    establishment_id: str = Field(..., description="ID de l'établissement")
    invoice_ids: List[str] = Field(..., description="Liste des factures à exporter")


@router.post("/export")
def export_invoices_endpoint(payload: InvoiceExportRequest):
    try:
        export_name, zip_bytes, _missing = export_invoices(
            establishment_id=payload.establishment_id,
            invoice_ids=payload.invoice_ids,
        )
    except ExportError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return StreamingResponse(
        BytesIO(zip_bytes),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{export_name}.zip"'
        },
    )
