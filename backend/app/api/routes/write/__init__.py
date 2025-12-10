from fastapi import APIRouter

from app.api.routes.write import articles, financial_reports, ingredients, invoices, recipes, suppliers

router = APIRouter(prefix="/logic/write", tags=["Logic Write"])

for sub_router in (
    articles.router,
    ingredients.router,
    invoices.router,
    recipes.router,
    suppliers.router,
    financial_reports.router,
):
    router.include_router(sub_router)

__all__ = ["router"]