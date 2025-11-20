from app.api.routes import product_stripe
from app.api.routes import price_stripe
from app.api.routes import sessions_ia
from app.api.routes import logs_ia
from app.api.routes import messages_ia
from app.api.routes import regex_patterns
from app.api.routes import price
from app.api.routes import supplier_alias
from app.api.routes import product
from app.api.routes import recipe_categories
from app.api.routes import import_job
from app.api.routes import recipes_subcategories
from app.api.routes import logs
from app.api.routes import billing_item
from app.api.routes import billing_account
from app.api.routes import user_profiles
from app.api.routes import support_ticket
from app.api.routes import maintenance
from app.api.routes import alert_logs
from app.api.routes import impersonations_padrino
from app.api.routes import supplier_merge_suggestions
from app.api.routes import live_score
from app.api.routes import score_matrix
from app.api.routes import market_supplier_alias
from app.api.routes import recommendations_ai
from app.api.routes import label_supplier
from app.api.routes import recipe_margin_category
from app.api.routes import market_suppliers
from app.api.routes import invoices_rejected
from app.api.routes import recipe_margin_subcategory
from app.api.routes import market_articles
from app.api.routes import market_master_articles
from app.api.routes import ingredients
from app.api.routes import mercuriales
from app.api.routes import history_recipes
from app.api.routes import variations
from app.api.routes import suppliers
from app.api.routes import invoices
from app.api.routes import user_establishment
from app.api.routes import articles
from app.api.routes import history_ingredients
from app.api.routes import establishment_email_alias
from app.api.routes import recipes
from app.api.routes import user_mercuriale_access
from app.api.routes import usage_counters
from app.api.routes import financial_recipes
from app.api.routes import financial_reports
from app.api.routes import financial_ingredients
from app.api.routes import mercuriale_articles
from app.api.routes import master_articles
from app.api.routes import vat_rates
from app.api.routes import countries
from app.api.routes import establishments
from app.api.routes import recipe_margin
from fastapi import FastAPI

app = FastAPI()

# Routes de logique métier /READ ONLY
## invoices_logic_read
from app.api.routes.read import invoices_logic_read
app.include_router(invoices_logic_read.router)
## invoices_details_read
from app.api.routes.read import invoices_details_read
app.include_router(invoices_details_read.router)
## master_articles_analysis_read
from app.api.routes.read import master_article_analysis_read
app.include_router(master_article_analysis_read.router)
## master_article_alternatives_read
from app.api.routes.read import master_article_alternatives_read
app.include_router(master_article_alternatives_read.router)
## market_article_comparison_read
from app.api.routes.read import market_article_comparison_read
app.include_router(market_article_comparison_read.router)
## master_article_recipes_analysis_read
from app.api.routes.read import master_article_recipes_analysis_read
app.include_router(master_article_recipes_analysis_read.router)
## recipe_ingredients_analysis_read
from app.api.routes.read import recipe_ingredients_analysis_read
app.include_router(recipe_ingredients_analysis_read.router)
## market_comparator_read
from app.api.routes.read import market_comparator_read
app.include_router(market_comparator_read.router)
## market_database_overview_read
from app.api.routes.read import market_database_overview_read
app.include_router(market_database_overview_read.router)

# Routes de logique métier /WRITE ONLY





# Routes CRUD
app.include_router(establishments.router)
app.include_router(countries.router)
app.include_router(vat_rates.router)
app.include_router(master_articles.router)
app.include_router(mercuriale_articles.router)
app.include_router(financial_ingredients.router)
app.include_router(financial_reports.router)
app.include_router(financial_recipes.router)
app.include_router(usage_counters.router)
app.include_router(user_mercuriale_access.router)
app.include_router(recipes.router)
app.include_router(establishment_email_alias.router)
app.include_router(history_ingredients.router)
app.include_router(articles.router)
app.include_router(user_establishment.router)
app.include_router(invoices.router)
app.include_router(suppliers.router)
app.include_router(variations.router)
app.include_router(history_recipes.router)
app.include_router(mercuriales.router)
app.include_router(ingredients.router)
app.include_router(market_master_articles.router)
app.include_router(market_articles.router)
app.include_router(recipe_margin_subcategory.router)
app.include_router(invoices_rejected.router)
app.include_router(market_suppliers.router)
app.include_router(recipe_margin_category.router)
app.include_router(label_supplier.router)
app.include_router(recipe_margin.router)
app.include_router(recommendations_ai.router)
app.include_router(market_supplier_alias.router)
app.include_router(score_matrix.router)
app.include_router(live_score.router)
app.include_router(supplier_merge_suggestions.router)
app.include_router(impersonations_padrino.router)
app.include_router(alert_logs.router)
app.include_router(maintenance.router)
app.include_router(support_ticket.router)
app.include_router(billing_account.router)
app.include_router(user_profiles.router)
app.include_router(billing_item.router)
app.include_router(logs.router)
app.include_router(recipes_subcategories.router)
app.include_router(import_job.router)
app.include_router(recipe_categories.router)
app.include_router(product.router)
app.include_router(supplier_alias.router)
app.include_router(price.router)
app.include_router(regex_patterns.router)
app.include_router(messages_ia.router)
app.include_router(logs_ia.router)
app.include_router(sessions_ia.router)
app.include_router(price_stripe.router)
app.include_router(product_stripe.router)