
-- ============================================================================
-- RAVY Database Schema (Supabase) - FINAL DDL
-- Date: 2025-11-03
-- Notes:
--  - Requires extensions: uuid-ossp (for uuid_generate_v4)
--  - Auth is handled by Supabase (auth.users). Application profile is in public.users
--  - RLS policies provided (baseline) for establishment-scoped tables
-- ============================================================================

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Schemas ----------
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS market;

-- ---------- Enums (public) ----------
DO $$ BEGIN
    CREATE TYPE public.establishment_role AS ENUM ('ADMIN','MANAGER','STAFF','VIEWER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.ingredient_type AS ENUM ('ARTICLE','FIXED','SUBRECIPE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.owner_type AS ENUM ('USER','ESTABLISHMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.pricing_strategy_method AS ENUM ('TARGET_MARGIN','MARKUP_ON_COST','CUSTOM_FORMULA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.variation_filter_mode AS ENUM ('ALL_VARIATIONS','OVER_5_PERCENT','OVER_10_PERCENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- (Ticket enums kept if needed later; no ticket table created in this version)
DO $$ BEGIN
    CREATE TYPE public.ticket_status AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.ticket_type AS ENUM ('BUG','QUESTION','FEATURE_REQUEST','BILLING','OTHER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------- Tables (public) ----------

-- Users (profile mirror; FK to auth.users.id via UUID)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4() REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    display_name text,
    phone text,
    super_admin boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Establishments
CREATE TABLE IF NOT EXISTS public.establishments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    country_id uuid REFERENCES public.countries(id) ON DELETE RESTRICT,
    vat_default_id uuid REFERENCES public.vat_rates(id) ON DELETE RESTRICT,
    archived_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- User ↔ Establishment roles
CREATE TABLE IF NOT EXISTS public.user_establishment (
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
    role public.establishment_role NOT NULL DEFAULT 'VIEWER',
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, establishment_id)
);
CREATE INDEX IF NOT EXISTS user_establishment_role_idx ON public.user_establishment (establishment_id, role);

-- Email alias for invoice import
CREATE TABLE IF NOT EXISTS public.establishment_email_alias (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    alias_local_part text NOT NULL, -- e.g. "nometablissement.factures"
    domain text NOT NULL DEFAULT 'ravy.fr',
    enabled boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT email_alias_unique UNIQUE (alias_local_part, domain)
);

-- Countries
CREATE TABLE IF NOT EXISTS public.countries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    iso_code text NOT NULL UNIQUE,
    currency_code text,
    currency_symbol text
);

-- VAT rates
CREATE TABLE IF NOT EXISTS public.vat_rates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_id uuid REFERENCES public.countries(id) ON DELETE RESTRICT,
    name text NOT NULL,
    percentage_rate numeric(6,4),
    absolute_rate numeric(12,4)
);

-- Suppliers (private)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    name text NOT NULL,
    market_supplier_id uuid REFERENCES market.market_suppliers(id) ON DELETE SET NULL,
    contact_email text,
    contact_phone text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT suppliers_establishment_name_key UNIQUE (establishment_id, name)
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    invoice_number text,
    date date NOT NULL,
    currency text,
    total_excl_tax numeric(12,4),
    total_tax numeric(12,4),
    total_incl_tax numeric(12,4),
    file_storage_path text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoices_establishment_date_idx ON public.invoices (establishment_id, date);

-- Articles (invoice lines)
CREATE TABLE IF NOT EXISTS public.articles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    date date NOT NULL, -- copy of invoices.date
    name_raw text NOT NULL,
    unit text,
    quantity numeric(12,4) NOT NULL DEFAULT 1,
    unit_price numeric(12,4) NOT NULL,
    line_total numeric(12,4),
    master_article_id uuid REFERENCES public.master_articles(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS articles_establishment_date_idx ON public.articles (establishment_id, date);
CREATE INDEX IF NOT EXISTS articles_master_article_idx ON public.articles (master_article_id);

-- Master articles (normalized)
CREATE TABLE IF NOT EXISTS public.master_articles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    no_space_name text NOT NULL,
    unit text,
    market_master_article_id uuid REFERENCES market.market_master_articles(id) ON DELETE SET NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT master_articles_unique_key UNIQUE (establishment_id, supplier_id, no_space_name, unit)
);

-- Variations (price changes)
CREATE TABLE IF NOT EXISTS public.variations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    master_article_id uuid NOT NULL REFERENCES public.master_articles(id) ON DELETE CASCADE,
    date date NOT NULL,
    old_unit_price numeric(12,4) NOT NULL,
    new_unit_price numeric(12,4) NOT NULL,
    percentage numeric(7,4) NOT NULL
);
CREATE INDEX IF NOT EXISTS variations_establishment_date_idx ON public.variations (establishment_id, date);

-- Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text,
    vat_id uuid REFERENCES public.vat_rates(id) ON DELETE SET NULL,
    target_margin_rate numeric(7,4),
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT recipes_establishment_name_key UNIQUE (establishment_id, name)
);

-- Ingredients
CREATE TABLE IF NOT EXISTS public.ingredients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    type public.ingredient_type NOT NULL,
    master_article_id uuid REFERENCES public.master_articles(id) ON DELETE RESTRICT,
    subrecipe_id uuid REFERENCES public.recipes(id) ON DELETE RESTRICT,
    fixed_unit_cost numeric(12,4),
    quantity numeric(12,4) NOT NULL,
    unit text,
    CONSTRAINT ingredient_article_fk_required CHECK (type <> 'ARTICLE' OR master_article_id IS NOT NULL),
    CONSTRAINT ingredient_subrecipe_fk_required CHECK (type <> 'SUBRECIPE' OR subrecipe_id IS NOT NULL),
    CONSTRAINT ingredient_fixed_cost_required CHECK (type <> 'FIXED' OR fixed_unit_cost IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS ingredients_recipe_idx ON public.ingredients (recipe_id);

-- History tables (structured, queryable) - manual population (no triggers)
CREATE TABLE IF NOT EXISTS public.history_recipes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text,
    vat_id uuid REFERENCES public.vat_rates(id) ON DELETE SET NULL,
    target_margin_rate numeric(7,4),
    active boolean DEFAULT true,
    version_number int4 NOT NULL,
    edited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS history_recipes_recipe_version_idx ON public.history_recipes (recipe_id, version_number);

CREATE TABLE IF NOT EXISTS public.history_ingredients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id uuid, -- optional pointer to original ingredient row
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    type public.ingredient_type NOT NULL,
    master_article_id uuid REFERENCES public.master_articles(id) ON DELETE RESTRICT,
    subrecipe_id uuid REFERENCES public.recipes(id) ON DELETE RESTRICT,
    fixed_unit_cost numeric(12,4),
    quantity numeric(12,4) NOT NULL,
    unit text,
    version_number int4 NOT NULL,
    edited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS history_ingredients_recipe_version_idx ON public.history_ingredients (recipe_id, version_number);

-- Financials (monthly)
CREATE TABLE IF NOT EXISTS public.financial_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    month date NOT NULL, -- YYYY-MM-01
    purchases_total numeric(12,4),
    sales_total numeric(12,4),
    gross_margin numeric(12,4),
    notes text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT financial_reports_unique UNIQUE (establishment_id, month)
);

CREATE TABLE IF NOT EXISTS public.financial_ingredients (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    financial_report_id uuid NOT NULL REFERENCES public.financial_reports(id) ON DELETE CASCADE,
    master_article_id uuid NOT NULL REFERENCES public.master_articles(id) ON DELETE RESTRICT,
    qty_total numeric(12,4),
    avg_unit_cost numeric(12,4),
    total_cost numeric(12,4)
);
CREATE INDEX IF NOT EXISTS financial_ingredients_report_article_idx ON public.financial_ingredients (financial_report_id, master_article_id);

CREATE TABLE IF NOT EXISTS public.financial_recipes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    financial_report_id uuid NOT NULL REFERENCES public.financial_reports(id) ON DELETE CASCADE,
    recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE RESTRICT,
    qty_produced numeric(12,4),
    avg_unit_cost numeric(12,4),
    total_cost numeric(12,4),
    margin_rate numeric(7,4),
    margin_value numeric(12,4)
);
CREATE INDEX IF NOT EXISTS financial_recipes_report_recipe_idx ON public.financial_recipes (financial_report_id, recipe_id);

-- Settings / Alerts / Recommendations / Impersonations
CREATE TABLE IF NOT EXISTS public.establishment_settings (
    establishment_id uuid PRIMARY KEY REFERENCES public.establishments(id) ON DELETE CASCADE,
    pricing_method public.pricing_strategy_method DEFAULT 'TARGET_MARGIN',
    pricing_params jsonb,
    variation_filter_mode public.variation_filter_mode DEFAULT 'ALL_VARIATIONS',
    variation_settings jsonb, -- extra thresholds, channels, phones
    live_score_settings jsonb,
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    type text NOT NULL,
    payload jsonb,
    sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS alerts_establishment_type_idx ON public.alerts (establishment_id, type);

CREATE TABLE IF NOT EXISTS public.recommendations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    context jsonb,
    suggestion text NOT NULL,
    estimated_impact numeric(12,4),
    accepted boolean,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.impersonations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text,
    started_at timestamptz DEFAULT now(),
    ended_at timestamptz
);
CREATE INDEX IF NOT EXISTS impersonations_actor_idx ON public.impersonations (actor_user_id, started_at);

-- Billing & Plans
CREATE TABLE IF NOT EXISTS public.billing_accounts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_type public.owner_type NOT NULL,
    owner_user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    owner_establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE,
    stripe_customer_id text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT billing_accounts_owner_check CHECK (
        (owner_type = 'USER' AND owner_user_id IS NOT NULL AND owner_establishment_id IS NULL) OR
        (owner_type = 'ESTABLISHMENT' AND owner_establishment_id IS NOT NULL AND owner_user_id IS NULL)
    ),
    CONSTRAINT billing_accounts_owner_unique UNIQUE (owner_type, owner_user_id, owner_establishment_id)
);

CREATE TABLE IF NOT EXISTS public.plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code text NOT NULL UNIQUE, -- APERO | PLAT | MENU
    name text NOT NULL,
    stripe_price_id text,
    active boolean DEFAULT true,
    sort_order int4 DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.plan_features (
    plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_key text NOT NULL, -- ex: max_recipes_per_establishment, max_invoices_per_period
    feature_value numeric(12,4),
    enabled boolean DEFAULT true,
    PRIMARY KEY (plan_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    billing_account_id uuid NOT NULL REFERENCES public.billing_accounts(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    stripe_subscription_id text,
    status text NOT NULL DEFAULT 'active',
    current_period_start timestamptz,
    current_period_end timestamptz,
    cancel_at_period_end boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS subscriptions_ba_active_idx ON public.subscriptions (billing_account_id, status);

CREATE TABLE IF NOT EXISTS public.subscription_applied_features (
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    feature_key text NOT NULL,
    feature_value numeric(12,4),
    enabled boolean DEFAULT true,
    PRIMARY KEY (subscription_id, feature_key)
);

CREATE TABLE IF NOT EXISTS public.usage_counters (
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    feature_key text NOT NULL, -- ex: max_invoices_per_period
    period_start timestamptz NOT NULL,
    period_end timestamptz NOT NULL,
    used_value numeric(12,4) NOT NULL DEFAULT 0,
    PRIMARY KEY (subscription_id, establishment_id, feature_key, period_start, period_end)
);

-- ---------- MARKET schema ----------
CREATE TABLE IF NOT EXISTS market.market_suppliers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    country_iso text
);
CREATE INDEX IF NOT EXISTS market_suppliers_name_idx ON market.market_suppliers (name);

CREATE TABLE IF NOT EXISTS market.market_master_articles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id uuid REFERENCES market.market_suppliers(id) ON DELETE SET NULL,
    name text NOT NULL,
    unit text
);
CREATE INDEX IF NOT EXISTS market_master_articles_name_idx ON market.market_master_articles (name);

CREATE TABLE IF NOT EXISTS market.market_prices (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_master_article_id uuid NOT NULL REFERENCES market.market_master_articles(id) ON DELETE CASCADE,
    date date NOT NULL,
    avg_unit_price numeric(12,4),
    source text,
    CONSTRAINT market_prices_unique UNIQUE (market_master_article_id, date)
);

-- ---------- Seeds (plans & features) ----------
INSERT INTO public.plans (id, code, name, stripe_price_id, active, sort_order)
VALUES
    ('00000000-0000-0000-0000-0000000000a1','APERO','Apéro',NULL,true,1),
    ('00000000-0000-0000-0000-0000000000b1','PLAT','Plat',NULL,true,2),
    ('00000000-0000-0000-0000-0000000000c1','MENU','Menu',NULL,true,3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.plan_features (plan_id, feature_key, feature_value, enabled) VALUES
    ('00000000-0000-0000-0000-0000000000a1','max_recipes_per_establishment',50,true),
    ('00000000-0000-0000-0000-0000000000a1','max_invoices_per_period',30,true),
    ('00000000-0000-0000-0000-0000000000b1','max_recipes_per_establishment',200,true),
    ('00000000-0000-0000-0000-0000000000b1','max_invoices_per_period',150,true),
    ('00000000-0000-0000-0000-0000000000c1','max_recipes_per_establishment',1000,true),
    ('00000000-0000-0000-0000-0000000000c1','max_invoices_per_period',1000,true)
ON CONFLICT DO NOTHING;

-- ---------- RLS (Row Level Security) ----------
-- Enable RLS on establishment-scoped tables
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_establishment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_email_alias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_applied_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

-- Helper: role precedence (VIEWER < STAFF < MANAGER < ADMIN) via SQL CASE
CREATE OR REPLACE FUNCTION public.role_at_least(a public.establishment_role, b public.establishment_role)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN a = b THEN true
        WHEN a = 'ADMIN' THEN true
        WHEN a = 'MANAGER' AND (b IN ('MANAGER','STAFF','VIEWER')) THEN true
        WHEN a = 'STAFF' AND (b IN ('STAFF','VIEWER')) THEN true
        WHEN a = 'VIEWER' AND b = 'VIEWER' THEN true
        ELSE false
    END;
$$;

-- Helper: get current role for auth.uid in an establishment
CREATE OR REPLACE FUNCTION public.current_role_for(est_id uuid)
RETURNS public.establishment_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT ue.role
    FROM public.user_establishment ue
    WHERE ue.user_id = auth.uid() AND ue.establishment_id = est_id
    LIMIT 1;
$$;

-- SupAdmin predicate
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT coalesce((SELECT u.super_admin FROM public.users u WHERE u.id = auth.uid()), false);
$$;

-- Generic policies generator (we inline policies for clarity)

-- establishments: SELECT allowed if member; UPDATE/DELETE for ADMIN only; INSERT restricted (platform logic)
DROP POLICY IF EXISTS p_establishments_select ON public.establishments;
CREATE POLICY p_establishments_select ON public.establishments
    FOR SELECT USING (
        is_super_admin() OR EXISTS (
            SELECT 1 FROM public.user_establishment ue
            WHERE ue.establishment_id = establishments.id AND ue.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS p_establishments_update ON public.establishments;
CREATE POLICY p_establishments_update ON public.establishments
    FOR UPDATE USING ( is_super_admin() OR role_at_least(current_role_for(establishments.id), 'ADMIN') );

DROP POLICY IF EXISTS p_establishments_delete ON public.establishments;
CREATE POLICY p_establishments_delete ON public.establishments
    FOR DELETE USING ( is_super_admin() OR role_at_least(current_role_for(establishments.id), 'ADMIN') );

-- user_establishment: users can see their memberships; admins can manage membership
ALTER TABLE public.user_establishment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_user_est_select ON public.user_establishment;
CREATE POLICY p_user_est_select ON public.user_establishment
    FOR SELECT USING ( is_super_admin() OR user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.user_establishment ue2 WHERE ue2.establishment_id = user_establishment.establishment_id AND ue2.user_id = auth.uid() AND ue2.role = 'ADMIN')
    );

DROP POLICY IF EXISTS p_user_est_modify ON public.user_establishment;
CREATE POLICY p_user_est_modify ON public.user_establishment
    FOR INSERT WITH CHECK ( is_super_admin() )
    -- Updates/deletes limited to super_admin for simplicity (can extend to ADMIN of est.)
    ;

-- Template macro to apply the same policy to many tables with establishment_id
-- (Here we just copy/paste for explicitness)

-- suppliers
DROP POLICY IF EXISTS p_suppliers_rw ON public.suppliers;
CREATE POLICY p_suppliers_rw ON public.suppliers
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- invoices
DROP POLICY IF EXISTS p_invoices_rw ON public.invoices;
CREATE POLICY p_invoices_rw ON public.invoices
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- articles
DROP POLICY IF EXISTS p_articles_rw ON public.articles;
CREATE POLICY p_articles_rw ON public.articles
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- master_articles
DROP POLICY IF EXISTS p_master_articles_rw ON public.master_articles;
CREATE POLICY p_master_articles_rw ON public.master_articles
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- variations
DROP POLICY IF EXISTS p_variations_rw ON public.variations;
CREATE POLICY p_variations_rw ON public.variations
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- recipes
DROP POLICY IF EXISTS p_recipes_rw ON public.recipes;
CREATE POLICY p_recipes_rw ON public.recipes
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- ingredients
DROP POLICY IF EXISTS p_ingredients_rw ON public.ingredients;
CREATE POLICY p_ingredients_rw ON public.ingredients
    USING ( is_super_admin() OR role_at_least(current_role_for((SELECT r.establishment_id FROM public.recipes r WHERE r.id = ingredients.recipe_id)), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for((SELECT r.establishment_id FROM public.recipes r WHERE r.id = ingredients.recipe_id)), 'STAFF') );

-- history_recipes
DROP POLICY IF EXISTS p_history_recipes_ro ON public.history_recipes;
CREATE POLICY p_history_recipes_ro ON public.history_recipes
    FOR SELECT USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') );

-- history_ingredients
DROP POLICY IF EXISTS p_history_ingredients_ro ON public.history_ingredients;
CREATE POLICY p_history_ingredients_ro ON public.history_ingredients
    FOR SELECT USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') );

-- financial_reports
DROP POLICY IF EXISTS p_financial_reports_rw ON public.financial_reports;
CREATE POLICY p_financial_reports_rw ON public.financial_reports
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- financial_ingredients
DROP POLICY IF EXISTS p_financial_ingredients_rw ON public.financial_ingredients;
CREATE POLICY p_financial_ingredients_rw ON public.financial_ingredients
    USING ( is_super_admin() OR role_at_least(current_role_for((SELECT fr.establishment_id FROM public.financial_reports fr WHERE fr.id = financial_ingredients.financial_report_id)), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for((SELECT fr.establishment_id FROM public.financial_reports fr WHERE fr.id = financial_ingredients.financial_report_id)), 'STAFF') );

-- financial_recipes
DROP POLICY IF EXISTS p_financial_recipes_rw ON public.financial_recipes;
CREATE POLICY p_financial_recipes_rw ON public.financial_recipes
    USING ( is_super_admin() OR role_at_least(current_role_for((SELECT fr.establishment_id FROM public.financial_reports fr WHERE fr.id = financial_recipes.financial_report_id)), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for((SELECT fr.establishment_id FROM public.financial_reports fr WHERE fr.id = financial_recipes.financial_report_id)), 'STAFF') );

-- establishment_settings
DROP POLICY IF EXISTS p_establishment_settings_rw ON public.establishment_settings;
CREATE POLICY p_establishment_settings_rw ON public.establishment_settings
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'MANAGER') );

-- alerts
DROP POLICY IF EXISTS p_alerts_rw ON public.alerts;
CREATE POLICY p_alerts_rw ON public.alerts
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- recommendations
DROP POLICY IF EXISTS p_recommendations_rw ON public.recommendations;
CREATE POLICY p_recommendations_rw ON public.recommendations
    USING ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'VIEWER') )
    WITH CHECK ( is_super_admin() OR role_at_least(current_role_for(establishment_id), 'STAFF') );

-- billing tables
DROP POLICY IF EXISTS p_billing_accounts_rw ON public.billing_accounts;
CREATE POLICY p_billing_accounts_rw ON public.billing_accounts
    USING (
        is_super_admin() OR
        (owner_type = 'USER' AND owner_user_id = auth.uid()) OR
        (owner_type = 'ESTABLISHMENT' AND role_at_least(current_role_for(owner_establishment_id), 'MANAGER'))
    )
    WITH CHECK ( is_super_admin() );

DROP POLICY IF EXISTS p_subscriptions_rw ON public.subscriptions;
CREATE POLICY p_subscriptions_rw ON public.subscriptions
    USING (
        is_super_admin() OR
        EXISTS (SELECT 1 FROM public.billing_accounts ba WHERE ba.id = subscriptions.billing_account_id AND
            ( (ba.owner_type='USER' AND ba.owner_user_id = auth.uid()) OR
              (ba.owner_type='ESTABLISHMENT' AND role_at_least(public.current_role_for(ba.owner_establishment_id),'MANAGER')) ))
    )
    WITH CHECK ( is_super_admin() );

DROP POLICY IF EXISTS p_subscription_applied_features_rw ON public.subscription_applied_features;
CREATE POLICY p_subscription_applied_features_rw ON public.subscription_applied_features
    USING ( is_super_admin() )
    WITH CHECK ( is_super_admin() );

DROP POLICY IF EXISTS p_usage_counters_rw ON public.usage_counters;
CREATE POLICY p_usage_counters_rw ON public.usage_counters
    USING (
        is_super_admin() OR
        EXISTS (SELECT 1 FROM public.subscriptions s JOIN public.billing_accounts ba ON ba.id = s.billing_account_id
                WHERE s.id = usage_counters.subscription_id AND
                ( (ba.owner_type='USER' AND ba.owner_user_id = auth.uid()) OR
                  (ba.owner_type='ESTABLISHMENT' AND role_at_least(public.current_role_for(ba.owner_establishment_id),'MANAGER')) ))
    )
    WITH CHECK ( is_super_admin() );

-- Enable RLS on users table but allow user to read/modify own row; super_admin bypass
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS p_users_self ON public.users;
CREATE POLICY p_users_self ON public.users
    USING ( is_super_admin() OR id = auth.uid() )
    WITH CHECK ( is_super_admin() OR id = auth.uid() );

-- ---------- Comments ----------
COMMENT ON TABLE public.users IS 'Application profile (auth handled by Supabase).';
COMMENT ON TABLE public.establishments IS 'Restaurants / establishments.';
COMMENT ON TABLE public.user_establishment IS 'User access per establishment (RLS pivot).';
COMMENT ON TABLE public.establishment_email_alias IS 'Per-establishment email alias for invoice imports (no custom alias).';
COMMENT ON TABLE public.suppliers IS 'Suppliers per establishment (mappable to market referential).';
COMMENT ON TABLE public.invoices IS 'Supplier invoices (OCR/import).';
COMMENT ON TABLE public.articles IS 'Invoice line items (with copied date for simpler queries).';
COMMENT ON TABLE public.master_articles IS 'Normalized references of articles.';
COMMENT ON TABLE public.variations IS 'Price variations against last known unit price of a master_article.';
COMMENT ON TABLE public.recipes IS 'Recipes (VAT at recipe level).';
COMMENT ON TABLE public.ingredients IS 'Ingredients (ARTICLE | FIXED | SUBRECIPE).';
COMMENT ON TABLE public.history_recipes IS 'Structured, queryable recipe history (manual versioning).';
COMMENT ON TABLE public.history_ingredients IS 'Structured, queryable ingredient history (manual versioning).';
COMMENT ON TABLE public.financial_reports IS 'Monthly financial report per establishment.';
COMMENT ON TABLE public.financial_ingredients IS 'Monthly snapshot by ingredient (master_article).';
COMMENT ON TABLE public.financial_recipes IS 'Monthly snapshot by recipe.';
COMMENT ON TABLE public.establishment_settings IS 'Per-establishment settings (pricing, variations, live score).';
COMMENT ON TABLE public.alerts IS 'Alerts (variations, cost drifts, etc.).';
COMMENT ON TABLE public.recommendations IS 'Actionable/AI recommendations.';
COMMENT ON TABLE public.impersonations IS 'Admin-only: impersonation audit log.';
COMMENT ON TABLE public.billing_accounts IS 'Billing account (Stripe customer linkage).';
COMMENT ON TABLE public.plans IS 'Editable plans (Apéro, Plat, Menu).';
COMMENT ON TABLE public.plan_features IS 'Editable features/quotas per plan.';
COMMENT ON TABLE public.subscriptions IS 'Active subscriptions linked to billing accounts.';
COMMENT ON TABLE public.subscription_applied_features IS 'Snapshot of plan features at subscription time.';
COMMENT ON TABLE public.usage_counters IS 'Per-period usage counters (e.g. invoices per period).';
COMMENT ON SCHEMA market IS 'Public, mutualized market referential.';

-- ============================================================================
-- END OF DDL
-- ============================================================================
