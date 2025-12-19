from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

ENV = os.getenv("ENV", "dev")

if ENV == "dev":
    allowed_ports = list(range(5173, 5190))  # marge confortable
    origins = (
        [f"http://localhost:{p}" for p in allowed_ports] +
        [f"http://127.0.0.1:{p}" for p in allowed_ports]
    )
else:
    origins = [
        "https://app.ravy.io",
        "https://dashboard.ravy.io",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



from app.api.routes import mercurial_request
from app.api.routes import mercuriale_master_article
from app.api.routes import mercuriale_subcategories
from app.api.routes import mercuriale_supplier
from app.api.routes import supplier_merge_request
from app.api.routes import mercuriale_categories
from app.api.routes import product_stripe
from app.api.routes import price_stripe
from app.api.routes import sessions_ia
from app.api.routes import logs_ia
from app.api.routes import messages_ia
from app.api.routes import regex_patterns
from app.api.routes import supplier_alias
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

# Routes de logique métier /READ ONLY
from app.api.routes.read import router as read_logic_router
app.include_router(read_logic_router)
# Routes de logique métier /WRITE ONLY
from app.api.routes.write import router as write_logic_router
app.include_router(write_logic_router)

# Routes WAKEUPPERS
from app.api.routes.wakeuppers import wake_invoice
app.include_router(wake_invoice.router)

# Routes PDF Recipes
from app.api.routes import pdf_recipes
app.include_router(pdf_recipes.router)





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
app.include_router(supplier_alias.router)
app.include_router(regex_patterns.router)
app.include_router(messages_ia.router)
app.include_router(logs_ia.router)
app.include_router(sessions_ia.router)
app.include_router(price_stripe.router)
app.include_router(product_stripe.router)
app.include_router(mercuriale_categories.router)
app.include_router(supplier_merge_request.router)
app.include_router(mercuriale_supplier.router)
app.include_router(mercuriale_subcategories.router)
app.include_router(mercuriale_master_article.router)
app.include_router(mercurial_request.router)