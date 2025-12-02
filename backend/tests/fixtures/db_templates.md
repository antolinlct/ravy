# CREATION D'UN ALERT_LOGS
## Table: alert_logs

alert_logs = fake_db.create_alert_logs({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "content": "string",
    "payload": {},
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "sent_to_number": "string",
    "sent_to_id": user_profiles["id"],
})

# CREATION D'UN ALERTS
## Table: alerts

alerts = fake_db.create_alerts({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "type": "string",
    "payload": {},
    "sent_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UN ARTICLES
## Table: articles

articles = fake_db.create_articles({
    "id": uuid4(),
    "invoice_id": invoices["id"],
    "establishment_id": establishments["id"],
    "supplier_id": suppliers["id"],
    "date": datetime(2025, 1, 1),
    "unit": "string",
    "quantity": 0,
    "unit_price": 0,
    "total": 0,
    "master_article_id": master_articles["id"],
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "discounts": 0,
    "duties_and_taxes": 0,
})

# CREATION D'UNE BILLING_ACCOUNT
## Table: billing_account

billing_account = fake_db.create_billing_account({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "stripe_customer_id_prod": "string",
    "stripe_customer_id_live": "string",
    "billing_cycle": "monthly, yearly",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "free_mode": True,
    "stripe_subscription_id_prod": "string",
    "stripe_subscription_id_live": "string",
})

# CREATION D'UNE BILLING_ACCOUNTS
## Table: billing_accounts

billing_accounts = fake_db.create_billing_accounts({
    "id": uuid4(),
    "owner_type": "USER, ESTABLISHMENT",
    "owner_user_id": users["id"],
    "owner_establishment_id": establishments["id"],
    "stripe_customer_id": "string",
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE BILLING_ITEM
## Table: billing_item

billing_item = fake_db.create_billing_item({
    "id": uuid4(),
    "billling_acount_id": billing_account["id"],
    "product_id": product_stripe["id"],
    "price_id": price_stripe["id"],
    "current_period_start": datetime(2025, 1, 1, 12, 00),
    "current_period_end": datetime(2025, 1, 1, 12, 00),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE CATEGORY
## Table: category

category = fake_db.create_category({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "name": "string",
})

# CREATION D'UNE COUNTRIES
## Table: countries

countries = fake_db.create_countries({
    "id": uuid4(),
    "name": "string",
    "currency_iso_code": "string",
    "currency_symbol": "string",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "stripe_tax_id_prod": "string",
    "stripe_tax_id_live": "string",
})

# CREATION D'UN ESTABLISHMENT_EMAIL_ALIAS
## Table: establishment_email_alias

establishment_email_alias = fake_db.create_establishment_email_alias({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "custom_email": "string",
    "enabled": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "custom_email_prefix": "string",
})

# CREATION D'UN ESTABLISHMENTS
## Table: establishments

establishments = fake_db.create_establishments({
    "id": uuid4(),
    "name": "string",
    "slug": "string",
    "country_id": countries["id"],
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "recommended_retail_price_method": "MULTIPLIER, PERCENTAGE, VALUE",
    "recommended_retail_price_value": 0,
    "logo_path": "string",
    "plan_id": "uuid",
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "average_daily_covers": 0,
    "average_annual_revenue": 0,
    "email": "string",
    "phone": "string",
    "intern_notes": "string",
    "active_sms": True,
    "type_sms": "FOOD, FOOD & BEVERAGES",
    "sms_variation_trigger": "ALL, ±5%, ±10%",
})

# CREATION D'UNE FINANCIAL_INGREDIENTS
## Table: financial_ingredients

financial_ingredients = fake_db.create_financial_ingredients({
    "id": uuid4(),
    "financial_report_id": financial_reports["id"],
    "master_article_id": master_articles["id"],
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "establishment_id": establishments["id"],
    "financial_recipe_id": financial_recipes["id"],
    "ingredient_id": ingredients["id"],
    "quantity": 0,
    "consumed_value": 0,
    "accumulated_loss": 0,
    "market_gap_value": 0,
    "market_gap_percentage": 0,
    "market_total_savings": 0,
    "market_balanced": 0,
})

# CREATION D'UNE FINANCIAL_RECIPES
## Table: financial_recipes

financial_recipes = fake_db.create_financial_recipes({
    "id": uuid4(),
    "financial_report_id": financial_reports["id"],
    "recipe_id": recipes["id"],
    "sales_number": 0,
    "total_revenue": 0,
    "total_cost": 0,
    "total_margin": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "establishment_id": establishments["id"],
    "balanced_margin": 0,
})

# CREATION D'UNE FINANCIAL_REPORTS
## Table: financial_reports

financial_reports = fake_db.create_financial_reports({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "month": datetime(2025, 1, 1),
    "ca_solid_ht": 0,
    "ca_liquid_ht": 0,
    "ca_total_ht": 0,
    "ca_tracked_recipes_total": 0,
    "ca_tracked_recipes_ratio": 0,
    "ca_untracked_recipes_total": 0,
    "ca_untracked_recipes_ratio": 0,
    "material_cost_solid": 0,
    "material_cost_liquid": 0,
    "material_cost_total": 0,
    "material_cost_ratio": 0,
    "material_cost_ratio_solid": 0,
    "material_cost_ratio_liquid": 0,
    "labor_cost_total": 0,
    "labor_cost_ratio": 0,
    "fte_count": 0,
    "fixed_charges_total": 0,
    "fixed_charges_ratio": 0,
    "variable_charges_total": 0,
    "variable_charges_ratio": 0,
    "commercial_margin_solid": 0,
    "commercial_margin_liquid": 0,
    "commercial_margin_total": 0,
    "commercial_margin_solid_ratio": 0,
    "commercial_margin_liquid_ratio": 0,
    "commercial_margin_total_ratio": 0,
    "production_cost_total": 0,
    "production_cost_ratio": 0,
    "ebitda": 0,
    "ebitda_ratio": 0,
    "break_even_point": 0,
    "safety_margin": 0,
    "safety_margin_ratio": 0,
    "revenue_per_employee": 0,
    "result_per_employee": 0,
    "salary_per_employee": 0,
    "avg_revenue_per_dish": 0,
    "avg_cost_per_dish": 0,
    "avg_margin_per_dish": 0,
    "theoretical_sales_solid": 0,
    "theoretical_material_cost_solid": 0,
    "multiplier_global": 0,
    "multiplier_solid": 0,
    "multiplier_liquid": 0,
    "notes": "string",
    "mscv": 0,
    "mscv_ratio": 0,
    "score_global": 0,
    "score_financial": 0,
    "score_recipe": 0,
    "score_purchase": 0,
    "other_charges_total": 0,
    "other_charges_ratio": 0,
})

# CREATION D'UNE HISTORY_INGREDIENTS
## Table: history_ingredients

history_ingredients = fake_db.create_history_ingredients({
    "id": uuid4(),
    "ingredient_id": ingredients["id"],
    "recipe_id": recipes["id"],
    "establishment_id": establishments["id"],
    "master_article_id": master_articles["id"],
    "subrecipe_id": recipes["id"],
    "unit_cost": 0,
    "quantity": 0,
    "unit": "string",
    "version_number": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "gross_unit_price": 0,
    "percentage_loss": 0,
    "date": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "loss_value": 0,
    "unit_cost_per_portion_recipe": 0,
    "source_article_id": articles["id"],
})

# CREATION D'UNE HISTORY_RECIPES
## Table: history_recipes

history_recipes = fake_db.create_history_recipes({
    "id": uuid4(),
    "recipe_id": recipes["id"],
    "establishment_id": establishments["id"],
    "version_number": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "date": datetime(2025, 1, 1, 12, 00),
    "purchase_cost_total": 0,
    "purchase_cost_per_portion": 0,
    "portion": 0,
    "invoice_affected": True,
    "vat_id": vat_rates["id"],
    "price_excl_tax": 0,
    "price_incl_tax": 0,
    "price_tax": 0,
    "margin": 0,
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
})

# CREATION D'UN IMPERSONATIONS
## Table: impersonations

impersonations = fake_db.create_impersonations({
    "id": uuid4(),
    "actor_user_id": users["id"],
    "target_user_id": users["id"],
    "reason": "string",
    "started_at": datetime(2025, 1, 1, 12, 00),
    "ended_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UN IMPERSONATIONS_PADRINO
## Table: impersonations_padrino

impersonations_padrino = fake_db.create_impersonations_padrino({
    "id": uuid4(),
    "actor_user_id": user_profiles["id"],
    "target_establishment_id": establishments["id"],
    "reason": "string",
    "started_at": datetime(2025, 1, 1, 12, 00),
    "ended_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UN IMPORT_JOB
## Table: import_job

import_job = fake_db.create_import_job({
    "created_at": datetime(2025, 1, 1, 12, 00),
    "id": uuid4(),
    "status": "pending, running, completed, error, ocr_failed",
    "establishment_id": "uuid",
    "file_path": "string",
    "ocr_result_json": {},
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "is_beverage": True,
})

# CREATION D'UN INGREDIENTS
## Table: ingredients

ingredients = fake_db.create_ingredients({
    "id": uuid4(),
    "recipe_id": recipes["id"],
    "type": "ARTICLE, FIXED, SUBRECIPE",
    "master_article_id": master_articles["id"],
    "subrecipe_id": recipes["id"],
    "unit_cost": 0,
    "quantity": 0,
    "unit": "string",
    "percentage_loss": 0,
    "gross_unit_price": 0,
    "establishment_id": establishments["id"],
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "loss_value": 0,
    "unit_cost_per_portion_recipe": 0,
})

# CREATION D'UN INVOICES
## Table: invoices

invoices = fake_db.create_invoices({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "supplier_id": suppliers["id"],
    "invoice_number": "string",
    "date": datetime(2025, 1, 1),
    "total_excl_tax": 0,
    "total_tax": 0,
    "total_incl_tax": 0,
    "file_storage_path": "string",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "import_mode": "EMAIL, FILEUPLOADER, MANUALLY",
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
})

# CREATION D'UN INVOICES_REJECTED
## Table: invoices_rejected

invoices_rejected = fake_db.create_invoices_rejected({
    "created_at": datetime(2025, 1, 1, 12, 00),
    "file_path": "string",
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "id": uuid4(),
    "rejection_reason": "string",
})

# CREATION D'UNE LABEL_SUPPLIER
## Table: label_supplier

label_supplier = fake_db.create_label_supplier({
    "id": uuid4(),
    "name": "string",
    "label": "FOOD, BEVERAGES, FIXED COSTS, VARIABLE COSTS, OTHER",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE LIVE_SCORE
## Table: live_score

live_score = fake_db.create_live_score({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "establishment_id": establishments["id"],
    "type": "global, purchase, recipe, financial",
    "value": 0,
})

# CREATION D'UNE LOGS
## Table: logs

logs = fake_db.create_logs({
    "created_at": datetime(2025, 1, 1, 12, 00),
    "user_id": "uuid",
    "establishment_id": "uuid",
    "type": "context, job",
    "action": "login, logout, create, update, delete, view, import",
    "text": "string",
    "json": {},
    "element_id": "uuid",
    "element_type": "invoice, recipe, supplier, financial_reports, user, establishment, variation",
    "id": uuid4(),
})

# CREATION D'UNE LOGS_IA
## Table: logs_ia

logs_ia = fake_db.create_logs_ia({
    "id": uuid4(),
    "session_id": sessions_ia["id"],
    "action": "string",
    "input": {},
    "output": {},
    "success": True,
    "error_message": "string",
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE MAINTENANCE
## Table: maintenance

maintenance = fake_db.create_maintenance({
    "id": uuid4(),
    "coutdown_hour": 0,
    "is_active": True,
    "message": "string",
    "start_date": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE MARKET_ARTICLES
## Table: market_articles

market_articles = fake_db.create_market_articles({
    "id": uuid4(),
    "market_master_article_id": market_master_articles["id"],
    "date": datetime(2025, 1, 1, 12, 00),
    "unit_price": 0,
    "unit": "string",
    "market_supplier_id": market_suppliers["id"],
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": "uuid",
    "updated_by": "uuid",
    "discounts": 0,
    "duties_and_taxes": 0,
    "establishment_id": "uuid",
    "invoice_path": "string",
    "quantity": 0,
    "invoice_id": "uuid",
})

# CREATION D'UNE MARKET_MASTER_ARTICLES
## Table: market_master_articles

market_master_articles = fake_db.create_market_master_articles({
    "id": uuid4(),
    "market_supplier_id": market_suppliers["id"],
    "name": "string",
    "unit": "string",
    "unformatted_name": "string",
    "current_unit_price": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": "uuid",
    "updated_by": "uuid",
})

# CREATION D'UNE MARKET_SUPPLIER_ALIAS
## Table: market_supplier_alias

market_supplier_alias = fake_db.create_market_supplier_alias({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "supplier_market_id": market_suppliers["id"],
    "alias": "string",
})

# CREATION D'UNE MARKET_SUPPLIERS
## Table: market_suppliers

market_suppliers = fake_db.create_market_suppliers({
    "id": uuid4(),
    "name": "string",
    "active": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": "uuid",
    "updated_by": "uuid",
    "label": "FOOD, BEVERAGES, FIXED COSTS, VARIABLE COSTS, OTHER",
})

# CREATION D'UNE MASTER_ARTICLES
## Table: master_articles

master_articles = fake_db.create_master_articles({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "supplier_id": suppliers["id"],
    "unformatted_name": "string",
    "unit": "string",
    "market_master_article_id": "uuid",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "current_unit_price": 0,
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "name": "string",
})

# CREATION D'UNE MERCURIALE_ARTICLES
## Table: mercuriale_articles

mercuriale_articles = fake_db.create_mercuriale_articles({
    "id": uuid4(),
    "mercuriale_id": mercuriales["id"],
    "market_master_article_id": "uuid",
    "unit": "string",
    "price_standard": 0,
    "price_plus": 0,
    "price_premium": 0,
    "vat_rate": 0,
    "active": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE MERCURIALES
## Table: mercuriales

mercuriales = fake_db.create_mercuriales({
    "id": uuid4(),
    "market_supplier_id": "uuid",
    "name": "string",
    "description": "string",
    "active": True,
    "effective_from": datetime(2025, 1, 1, 12, 00),
    "effective_to": datetime(2025, 1, 1, 12, 00),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE MESSAGES
## Table: messages

messages = fake_db.create_messages({
    "id": uuid4(),
    "session_id": sessions["id"],
    "sender": "string",
    "content": "string",
    "metadata": {},
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE MESSAGES_IA
## Table: messages_ia

messages_ia = fake_db.create_messages_ia({
    "id": uuid4(),
    "session_id": sessions_ia["id"],
    "sender": "string",
    "content": "string",
    "metadata": {},
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE PLAN_FEATURES
## Table: plan_features

plan_features = fake_db.create_plan_features({
    "plan_id": plans["id"],
    "feature_key": "string",
    "feature_value": 0,
    "enabled": True,
})

# CREATION D'UNE PLANS
## Table: plans

plans = fake_db.create_plans({
    "id": uuid4(),
    "code": "string",
    "name": "string",
    "stripe_price_id": "string",
    "active": True,
    "sort_order": 0,
})

# CREATION D'UNE PRICE
## Table: price

price = fake_db.create_price({
    "id": uuid4(),
    "product_id": product["id"],
    "billing_cycle": "monthly, yearly",
    "stripe_price_id_prod": "string",
    "stripe_price_id_live": "string",
    "unit_amount": 0,
    "is_active": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE PRICE_STRIPE
## Table: price_stripe

price_stripe = fake_db.create_price_stripe({
    "id": uuid4(),
    "product_id": product_stripe["id"],
    "billing_cycle": "monthly, yearly",
    "stripe_price_id_prod": "string",
    "stripe_price_id_live": "string",
    "unit_amount": 0,
    "is_active": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE PRODUCT
## Table: product

product = fake_db.create_product({
    "id": uuid4(),
    "internal_code": "string",
    "marketing_name": "string",
    "plan_or_addon": "plan, addon",
    "description": "string",
    "stripe_product_id_prod": "string",
    "stripe_product_id_live": "string",
    "included_seats": 0,
    "included_invoices": 0,
    "included_recipes": 0,
    "addon_category": "seat, invoices, recipe",
    "addon_value": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE PRODUCT_STRIPE
## Table: product_stripe

product_stripe = fake_db.create_product_stripe({
    "id": uuid4(),
    "internal_code": "string",
    "marketing_name": "string",
    "plan_or_addon": "plan, addon",
    "description": "string",
    "stripe_product_id_prod": "string",
    "stripe_product_id_live": "string",
    "included_seats": 0,
    "included_invoices": 0,
    "included_recipes": 0,
    "addon_category": "seat, invoices, recipe",
    "addon_value": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE RECIPE_CATEGORIES
## Table: recipe_categories

recipe_categories = fake_db.create_recipe_categories({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "name": "string",
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "establishment_id": establishments["id"],
})

# CREATION D'UNE RECIPE_MARGIN
## Table: recipe_margin

recipe_margin = fake_db.create_recipe_margin({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "date": datetime(2025, 1, 1, 12, 00),
    "average_margin": 0,
    "establishment_id": establishments["id"],
    "responsible_recipe": recipes["id"],
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
})

# CREATION D'UNE RECIPE_MARGIN_CATEGORY
## Table: recipe_margin_category

recipe_margin_category = fake_db.create_recipe_margin_category({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "date": datetime(2025, 1, 1, 12, 00),
    "average_margin": 0,
    "establishment_id": establishments["id"],
    "responsible_recipe": recipes["id"],
    "category_id": recipe_categories["id"],
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
})

# CREATION D'UNE RECIPE_MARGIN_SUBCATEGORY
## Table: recipe_margin_subcategory

recipe_margin_subcategory = fake_db.create_recipe_margin_subcategory({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "date": datetime(2025, 1, 1, 12, 00),
    "average_margin": 0,
    "establishment_id": establishments["id"],
    "responsible_recipe": recipes["id"],
    "subcategory_id": recipes_subcategories["id"],
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
})

# CREATION D'UNE RECIPES
## Table: recipes

recipes = fake_db.create_recipes({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "name": "string",
    "vat_id": vat_rates["id"],
    "recommanded_retail_price": 0,
    "active": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "saleable": True,
    "contains_sub_recipe": True,
    "purchase_cost_total": 0,
    "portion": 0,
    "purchase_cost_per_portion": 0,
    "technical_data_sheet_instructions": "string",
    "current_margin": 0,
    "portion_weight": 0,
    "price_excl_tax": 0,
    "price_incl_tax": 0,
    "price_tax": 0,
    "category_id": recipe_categories["id"],
    "subcategory_id": recipes_subcategories["id"],
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "technical_data_sheet_image_path": "string",
})

# CREATION D'UNE RECIPES_SUBCATEGORIES
## Table: recipes_subcategories

recipes_subcategories = fake_db.create_recipes_subcategories({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "name": "string",
    "category_id": recipe_categories["id"],
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": "uuid",
    "updated_by": user_profiles["id"],
    "establishment_id": establishments["id"],
})

# CREATION D'UNE RECOMMENDATIONS
## Table: recommendations

recommendations = fake_db.create_recommendations({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "context": {},
    "suggestion": "string",
    "estimated_impact": 0,
    "accepted": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE RECOMMENDATIONS_AI
## Table: recommendations_ai

recommendations_ai = fake_db.create_recommendations_ai({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "context": {},
    "suggestion": "string",
    "estimated_impact": 0,
    "accepted": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE REGEX_PATTERNS
## Table: regex_patterns

regex_patterns = fake_db.create_regex_patterns({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "type": "supplier_name, market_master_article_name, master_article_alternative",
    "regex": "string",
})

# CREATION D'UNE SCORE_MATRIX
## Table: score_matrix

score_matrix = fake_db.create_score_matrix({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "purchase_result": 0,
    "financial_result": 0,
    "score": 0,
})

# CREATION D'UNE SESSIONS
## Table: sessions

sessions = fake_db.create_sessions({
    "id": uuid4(),
    "user_id": "uuid",
    "establishment_id": "uuid",
    "context": {},
    "started_at": datetime(2025, 1, 1, 12, 00),
    "ended_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE SESSIONS_IA
## Table: sessions_ia

sessions_ia = fake_db.create_sessions_ia({
    "id": uuid4(),
    "user_id": "uuid",
    "establishment_id": "uuid",
    "context": {},
    "started_at": datetime(2025, 1, 1, 12, 00),
    "ended_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UNE SUBCATEGORY
## Table: subcategory

subcategory = fake_db.create_subcategory({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "name": "string",
    "category_id": category["id"],
})

# CREATION D'UNE SUBSCRIPTION_APPLIED_FEATURES
## Table: subscription_applied_features

subscription_applied_features = fake_db.create_subscription_applied_features({
    "subscription_id": subscriptions["id"],
    "feature_key": "string",
    "feature_value": 0,
    "enabled": True,
})

# CREATION D'UNE SUBSCRIPTIONS
## Table: subscriptions

subscriptions = fake_db.create_subscriptions({
    "id": uuid4(),
    "billing_account_id": billing_accounts["id"],
    "plan_id": plans["id"],
    "stripe_subscription_id": "string",
    "status": "string",
    "current_period_start": datetime(2025, 1, 1, 12, 00),
    "current_period_end": datetime(2025, 1, 1, 12, 00),
    "cancel_at_period_end": True,
})

# CREATION D'UNE SUPPLIER_ALIAS
## Table: supplier_alias

supplier_alias = fake_db.create_supplier_alias({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "alias": "string",
    "establishment_id": establishments["id"],
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
})

# CREATION D'UNE SUPPLIER_MERGE_SUGGESTIONS
## Table: supplier_merge_suggestions

supplier_merge_suggestions = fake_db.create_supplier_merge_suggestions({
    "id": uuid4(),
    "created_at": datetime(2025, 1, 1, 12, 00),
    "reviewed_at": datetime(2025, 1, 1, 12, 00),
    "establishment_id": establishments["id"],
    "source_supplier_id": suppliers["id"],
    "target_supplier_id": suppliers["id"],
    "similarity_score": 0,
    "status": "pending, accepted, ignored, dismissed",
})

# CREATION D'UNE SUPPLIERS
## Table: suppliers

suppliers = fake_db.create_suppliers({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "name": "string",
    "market_supplier_id": "uuid",
    "contact_email": "string",
    "contact_phone": "string",
    "active": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
    "active_analyses": True,
    "label": "FOOD, BEVERAGES, FIXED COSTS, VARIABLE COSTS, OTHER",
})

# CREATION D'UNE SUPPORT_TICKET
## Table: support_ticket

support_ticket = fake_db.create_support_ticket({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "user_profile_id": user_profiles["id"],
    "invoice_path": "string",
    "status": "open, in progress, resolved, error",
    "object": "string",
    "description": "string",
    "intern_notes": "string",
    "resolution_notes": "string",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "resolved_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UN USAGE_COUNTERS
## Table: usage_counters

usage_counters = fake_db.create_usage_counters({
    "establishment_id": establishments["id"],
    "period_start": datetime(2025, 1, 1, 12, 00),
    "period_end": datetime(2025, 1, 1, 12, 00),
    "used_value": 0,
    "id": uuid4(),
    "limit_value": 0,
    "value_category": "seat, invoices, recipe",
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UN USER_ESTABLISHMENT
## Table: user_establishment

user_establishment = fake_db.create_user_establishment({
    "user_id": user_profiles["id"],
    "establishment_id": establishments["id"],
    "role": "padrino, owner, admin, manager, staff",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "created_by": user_profiles["id"],
    "updated_by": user_profiles["id"],
})

# CREATION D'UN USER_MERCURIALE_ACCESS
## Table: user_mercuriale_access

user_mercuriale_access = fake_db.create_user_mercuriale_access({
    "id": uuid4(),
    "user_id": user_profiles["id"],
    "mercuriale_level": "STANDARD, PLUS, PREMIUM",
    "assigned_by": user_profiles["id"],
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})

# CREATION D'UN USER_PROFILES
## Table: user_profiles

user_profiles = fake_db.create_user_profiles({
    "id": uuid4(),
    "first_name": "string",
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "last_name": "string",
    "intern_notes": "string",
    "phone_sms": "string",
})

# CREATION D'UN USERS
## Table: users

users = fake_db.create_users({
    "id": uuid4(),
    "email": "string",
    "first_name": "string",
    "phone": "string",
    "super_admin": True,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "last_login": datetime(2025, 1, 1, 12, 00),
    "last_name": "string",
})

# CREATION D'UNE VARIATIONS
## Table: variations

variations = fake_db.create_variations({
    "id": uuid4(),
    "establishment_id": establishments["id"],
    "master_article_id": master_articles["id"],
    "date": datetime(2025, 1, 1),
    "old_unit_price": 0,
    "new_unit_price": 0,
    "percentage": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
    "alert_logs_id": alert_logs["id"],
    "is_viewed": True,
    "invoice_id": invoices["id"],
    "is_deleted": True,
})

# CREATION D'UNE VAT_RATES
## Table: vat_rates

vat_rates = fake_db.create_vat_rates({
    "id": uuid4(),
    "country_id": countries["id"],
    "name": "string",
    "percentage_rate": 0,
    "absolute_rate": 0,
    "created_at": datetime(2025, 1, 1, 12, 00),
    "updated_at": datetime(2025, 1, 1, 12, 00),
})
