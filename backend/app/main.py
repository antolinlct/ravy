from app.api.routes import ingredients
from app.api.routes import mercuriales
from app.api.routes import history_recipes
from app.api.routes import variations
from app.api.routes import suppliers
from app.api.routes import invoices
from app.api.routes import subscription_applied_features
from app.api.routes import user_establishment
from app.api.routes import articles
from app.api.routes import establishment_settings
from app.api.routes import history_ingredients
from app.api.routes import establishment_email_alias
from app.api.routes import plans
from app.api.routes import recipes
from app.api.routes import user_mercuriale_access
from app.api.routes import billing_accounts
from app.api.routes import usage_counters
from app.api.routes import financial_recipes
from app.api.routes import financial_reports
from app.api.routes import plan_features
from app.api.routes import financial_ingredients
from app.api.routes import recommendations
from app.api.routes import mercuriale_articles
from app.api.routes import subscriptions
from app.api.routes import master_articles
from app.api.routes import users
from app.api.routes import vat_rates
from app.api.routes import countries
from app.api.routes import establishments
from app.api.routes import impersonations
from app.api.routes import alerts
from fastapi import FastAPI

app = FastAPI()

app.include_router(alerts.router)
app.include_router(impersonations.router)
app.include_router(establishments.router)
app.include_router(countries.router)
app.include_router(vat_rates.router)
app.include_router(users.router)
app.include_router(master_articles.router)
app.include_router(subscriptions.router)
app.include_router(mercuriale_articles.router)
app.include_router(recommendations.router)
app.include_router(financial_ingredients.router)
app.include_router(plan_features.router)
app.include_router(financial_reports.router)
app.include_router(financial_recipes.router)
app.include_router(usage_counters.router)
app.include_router(billing_accounts.router)
app.include_router(user_mercuriale_access.router)
app.include_router(recipes.router)
app.include_router(plans.router)
app.include_router(establishment_email_alias.router)
app.include_router(history_ingredients.router)
app.include_router(establishment_settings.router)
app.include_router(articles.router)
app.include_router(user_establishment.router)
app.include_router(subscription_applied_features.router)
app.include_router(invoices.router)
app.include_router(suppliers.router)
app.include_router(variations.router)
app.include_router(history_recipes.router)
app.include_router(mercuriales.router)
app.include_router(ingredients.router)