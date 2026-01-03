from fastapi import APIRouter

from app.api.routes.read import invoices_details_read
from app.api.routes.read import invoices_logic_read
from app.api.routes.read import market_article_comparison_read
from app.api.routes.read import market_comparator_read
from app.api.routes.read import market_database_overview_read
from app.api.routes.read import master_article_alternatives_read
from app.api.routes.read import master_article_analysis_read
from app.api.routes.read import master_article_recipes_analysis_read
from app.api.routes.read import recipe_ingredients_analysis_read

router = APIRouter(prefix="", tags=["Read Logics"])

router.include_router(invoices_logic_read.router)
router.include_router(invoices_details_read.router)
router.include_router(master_article_analysis_read.router)
router.include_router(master_article_alternatives_read.router)
router.include_router(market_article_comparison_read.router)
router.include_router(master_article_recipes_analysis_read.router)
router.include_router(recipe_ingredients_analysis_read.router)
router.include_router(market_comparator_read.router)
router.include_router(market_database_overview_read.router)
