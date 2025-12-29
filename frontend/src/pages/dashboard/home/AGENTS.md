# Dashboard home (home/index.tsx) - AGENTS

## Purpose
- Show a quick overview: financial summary, recent price variations, overpriced products, recipe margin trend, and low margin recipes.
- This page is currently mock-driven; wire it to backend data when ready.

## Current implementation (factored layout)
- Page: `frontend/src/pages/dashboard/home/index.tsx`
  - Only composes blocks + greeting.
- Data hook: `frontend/src/pages/dashboard/home/api.ts`
  - `useDashboardHomeData()` loads/normalizes all data.
- Types: `frontend/src/pages/dashboard/home/types.ts`
  - Shared DTOs for UI mapping.
- Components: `frontend/src/pages/dashboard/home/components/*`
  - `summary-card.tsx`, `latest-variations-card.tsx`, `optimized-products-card.tsx`,
    `margin-chart-card.tsx`, `top-low-margin-card.tsx`, `empty-state.tsx`.
- Empty states are unified via `EmptyState` component.

## Data flow (how it works now)
- `useDashboardHomeData()` uses `useEstablishment()` to read `estId`.
- It loads in parallel:
  - `/variations`, `/master_articles`, `/suppliers`, `/recipes`, `/recipe_margin`.
- It loads in sequence:
  - Latest `/financial_reports` (by `month desc`) -> then `/financial_ingredients` filtered by report.
  - `/invoices/sum` scoped to the report month.
- Maps and computes:
  - Builds lookup maps for master articles + suppliers.
  - Aggregates financial ingredients by `master_article_id`.
  - Normalizes margins (ratio vs percent) for charts + top list.

## Frontend data blocks (current mocks -> target data)
- Greeting: `useUser().fullName` -> display first name fallback "l'equipe Ravy".
- Resume financier (`invoiceStats`):
  - "Factures importees" = invoice count for current month.
  - "TVA collectee" = sum_tva for current month.
  - "Depenses HT" = sum_ht for current month.
  - If a financial report is used, display month from `financial_reports.month`.
- Dernieres variations (`latestVariations`):
  - List of article + supplier + price change percent.
  - Should map to `public.variations` joined with `public.master_articles` and `public.suppliers`.
- Produits a optimiser (`overpricedProducts`):
  - Source is the monthly financial report (not the market overview list).
  - Use the latest `financial_reports` row for the establishment, then `financial_ingredients` filtered by `financial_report_id`.
  - Quantity and savings come from `financial_ingredients`.
  - Fields needed: name, supplier, unitPaid, unitMarket, monthlyQty, unit.
  - Note: unit prices are not stored in `financial_ingredients`, only the gap and total savings.
  - Aggregation: group by `master_article_id` (sum quantity + market_total_savings, weighted avg for market_gap_value).
- Marge moyenne de vos recettes (area chart):
  - Data shape: `{ date: "YYYY-MM-DD", value: number }` (last 5 points).
  - Use average margin series by date.
- Top 5 recettes a optimiser:
  - Active + saleable recipes, sorted by lowest margin.

## Backend logic to use
- Invoices totals:
  - Read: `backend/app/logic/read/invoices_logic.py` (`/invoices/sum`).
  - Note: logic expects `total_ht/total_tva/total_ttc`.
- Variations:
  - Read: `backend/app/api/routes/variations.py` (`/variations`).
  - Write source: `backend/app/logic/write/invoices_imports.py` creates rows in `public.variations`.
- Market comparison (overpriced products):
  - Source of truth is `backend/app/logic/write/financial_reports.py`.
  - `financial_reports` + `financial_ingredients` store the computed gap and savings.
  - Read via `/financial_reports` + `/financial_ingredients` (filter by report id).
  - If the UI needs unitPaid/unitMarket, fetch them separately (articles + market_articles) or add fields.
- Recipe margins:
  - Write: `backend/app/logic/write/shared/recipes_average_margins.py` updates `public.recipe_margin`.
  - Read: `/recipe_margin` or fallback to `public.recipes.current_margin`.

## Contracts / tables (from contracts_summary.json)
- `public.invoices`: totals and date for month stats.
  - Fields: `date`, `total_excl_tax`, `total_tax`, `total_incl_tax`, `supplier_id`, `establishment_id`.
  - Warning: read logic uses `total_ht/total_tva/total_ttc` (naming mismatch to resolve).
- `public.variations`: `establishment_id`, `master_article_id`, `date`, `old_unit_price`, `new_unit_price`, `percentage`, `is_viewed`, `is_deleted`.
- `public.articles`: `unit_price`, `quantity`, `date`, `master_article_id`, `supplier_id`.
- `public.master_articles`: `name`/`unformatted_name`, `unit`, `market_master_article_id`.
- `public.financial_reports`: one report per establishment + month (`month`).
- `public.financial_recipes`: sales totals per recipe for a report.
- `public.financial_ingredients`:
  - `quantity` (monthly qty, derived from sales_number * ingredient quantity per portion).
  - `market_gap_value`, `market_gap_percentage`, `market_total_savings` (gap vs market).
- `public.suppliers`: `name`, `label`.
- `public.recipes`: `name`, `current_margin`, `active`, `saleable`.
- `public.recipe_margin`: `average_margin`, `date`, `establishment_id`.
- `market.market_master_articles` + `market.market_articles` + `market.market_suppliers` for market averages and series.

## Derived calculations (in page)
- totalMonthlySavings = sum(financial_ingredients.market_total_savings where market_gap_value > 0).
- monthlyQty = financial_ingredients.quantity (sales_number * quantity_per_portion from financial_reports logic).
- unitDiff = financial_ingredients.market_gap_value (article avg - market avg).
- unitDiff label uses signed value and `/UNIT`.
- topLowMargin = active && saleable && marginValue != null, sorted asc, limit 5.

## Important implementation notes
- `financial_ingredients` does not store unit prices. The UI derives `unitPaid`/`unitMarket` from:
  - `market_gap_value` and `market_gap_percentage` (weighted by quantity).
  - If `market_gap_percentage` is 0 or missing, show `--`.
- `current_margin` and `recipe_margin.average_margin` can be stored as ratios (0-1) or percents (0-100).
  - The hook normalizes values: if abs(value) <= 1, it is multiplied by 100.
- `/financial_ingredients` does not filter by report in the backend service.
  - The hook filters client-side by `financial_report_id`.
  - If performance becomes an issue, add a backend filter.
- Month displayed on the summary card comes from `financial_reports.month`.
  - `/invoices/sum` uses month bounds from that value.
- `useDashboardHomeData` relies on `axiosClient` (Supabase token injected).

## API endpoints + params used (current hook)
- `GET /financial_reports?establishment_id=...&order_by=month&direction=desc&limit=1`
- `GET /financial_ingredients?establishment_id=...&financial_report_id=...&order_by=market_total_savings&direction=desc&limit=2000`
- `GET /invoices/sum?establishment_id=...&start_date=YYYY-MM-01&end_date=YYYY-MM-30`
- `GET /variations?establishment_id=...&order_by=date&direction=desc&limit=20`
- `GET /master_articles?establishment_id=...&order_by=unformatted_name&direction=asc&limit=2000`
- `GET /suppliers?establishment_id=...&order_by=name&direction=asc&limit=1000`
- `GET /recipes?establishment_id=...&order_by=name&direction=asc&limit=2000`
- `GET /recipe_margin?establishment_id=...&order_by=date&direction=desc&limit=10`

## Sorting / filters to apply
- Variations: order by `date` desc, filter `is_deleted = false`; optional `is_viewed = false`.
- Overpriced products: filter `market_gap_value > 0`; sort by `market_total_savings` desc; limit 6-8.
- Margin series: last 5 by date asc (or last 5 points after sort).

## Formatting
- Locale: `fr-FR` number formatting.
- Currency: use euros; percents keep sign.
- If data missing, return "--" and avoid division by zero.
