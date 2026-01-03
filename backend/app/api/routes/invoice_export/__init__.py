from fastapi import APIRouter

from app.api.routes.invoice_export import invoices_export

router = APIRouter(tags=["Invoices - Export"])
router.include_router(invoices_export.router)

__all__ = ["router"]
