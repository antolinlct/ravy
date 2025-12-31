# Dashboard performance (performance/*) - AGENTS

## Purpose
- Show performance scores and monthly financial reports for an establishment.
- Three pages:
  - `scores.tsx`: global and per-domain scores + consultant guidance.
  - `reports.tsx`: report history + trend chart + report creation dialog.
  - `details.tsx`: single report detail with KPIs, financial sections, and annexes.

## Current implementation (factored layout)
- Pages:
  - `frontend/src/pages/dashboard/performance/scores.tsx`
  - `frontend/src/pages/dashboard/performance/reports.tsx`
  - `frontend/src/pages/dashboard/performance/details.tsx`
- Components (UI blocks only):
  - Scores: `ScoreHeader`, `ScoreGlobalCard`, `ScoreTrendCard`, `ScoreSummaryGrid`, `ScoreConsultantCard`.
  - Reports list: `ReportsHeader`, `ReportsTrendCard`, `ReportsHistoryCard`, `ReportCreateDialog`.
  - Report detail: `ReportDetailHeader`, `ReportEditDialog`, `ReportPerformanceMetrics`,
    `ReportSectionsCard`, `ReportConsultantCard`, `ReportAnnexesCard`,
    `CostsSection`, `MarginsSection`, `LaborSection`, `MenuSection`.
- Data is now fetched via `frontend/src/pages/dashboard/performance/api.ts` (no mocks).

## Backend logic to use
- **Write / compute**: `backend/app/logic/write/financial_reports.py`
  - Generates monthly data and fills:
    - `public.financial_reports`
    - `public.financial_ingredients`
    - `public.financial_recipes`
- This logic is the source of truth for KPIs, ratios, and deltas.

## Contracts / tables (from contracts_summary.json)
- `public.financial_reports`
  - Month-level metrics: revenue, material cost, labor, fixed/variable charges, ratios, margins, break-even, safety margin, etc.
- `public.financial_ingredients`
  - Monthly product consumption (quantity, total savings, gap vs market).
  - Used for annexes: product consumption table + avg price.
- `public.financial_recipes`
  - Monthly recipe sales/revenue and margin data.
  - Used for annexes: recipe efficiency table.
- `public.recipes` + categories/subcategories
  - Names and categorization for annexes and edit dialogs.
- `public.master_articles` + `public.suppliers`
  - Names for product annexes (join via master_article_id / supplier_id).

## UI mapping (what each page expects)
### `scores.tsx`
- Needs a **global score** + three sub-scores (buy/recipes/finance).
- Trend series by month for the selected year.
- Ranking position / total to select the reward badge.
- Consultant message derived from the weakest score.
- Score values come from `/live_score` with fallback to the latest `financial_reports` score fields.
- Score deltas are point differences between the latest and previous report.

### `reports.tsx`
- Monthly report list:
  - period label (`month`)
  - revenue, expenses, result, margin
  - last updated date (`updated_at`)
- Trend chart across recent months.
- Create dialog:
  - Requires list of active/sellable recipes (for per-recipe sales).
  - Must prevent duplicate month creation.
- Creation uses `submitFinancialReport` to call `/logic/write/financial-report`, then reloads `/financial_reports`.

### `details.tsx`
- Header:
  - Report period (month) + last update timestamp.
- KPI strip (performance metrics):
  - Revenue, labor, purchases/charges, operating result + deltas.
- Financial sections (tabbed):
  - Costs: material/labor/production + occupancy/overhead/operating.
  - Margins: commercial margin, multipliers, EBITDA, break-even, safety margin.
  - Labor: revenue/result per employee + payroll ratios.
  - Menu: fixed vs variable split, avg revenue/cost/margin per dish, theoretical sales/costs.
- Annexes:
  - Product consumption table (from `financial_ingredients`).
  - Recipe efficiency table (from `financial_recipes`).
  - Category and subcategory filters are provided by `recipe_categories` and `recipes_subcategories`.

## Derived calculations (used in the UI)
- `result = revenue - expenses` (for list and trend).
- `margin = result / revenue` (percentage).
- `otherChargesTotal = production - material - labor` (used in Costs section).
- Ratios can be stored as percent (0-100) or ratio (0-1); normalize consistently.
- Deltas are month-over-month changes against previous report.
- `expenses` uses `variable_charges_total` when available, otherwise `ca_total_ht - ebitda`.
- `avgPrice` in annexes uses `consumed_value / quantity` when quantity is available.

## Endpoints (usage)
- `GET /financial_reports?establishment_id=...&order_by=month&direction=desc`
- `GET /financial_reports?establishment_id=...&month=...` (detail)
- `GET /financial_ingredients?establishment_id=...&financial_report_id=...`
- `GET /financial_recipes?establishment_id=...&financial_report_id=...`
- `GET /live_score?establishment_id=...` (scores)
- `POST /logic/write/financial-report` (create/update report)

## Important implementation notes
- `ReportCreateDialog` and `ReportEditDialog` call `submitFinancialReport` and then reload reports.
- Use the **latest report** as reference when computing deltas and score point changes.
- Annexes require joins to display product/recipe names and categories.
- Keep formatting consistent: `fr-FR`, euro formatting, percent with sign, and safe `--` fallback for missing data.
