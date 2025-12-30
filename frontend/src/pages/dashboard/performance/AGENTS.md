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
- Data is currently mock-driven in all pages; replace with API calls.

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

### `reports.tsx`
- Monthly report list:
  - period label (`month`)
  - revenue, expenses, result, margin
  - last updated date (`updated_at`)
- Trend chart across recent months.
- Create dialog:
  - Requires list of active/sellable recipes (for per-recipe sales).
  - Must prevent duplicate month creation.

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

## Derived calculations (needed when wiring API)
- `result = revenue - expenses` (for list and trend).
- `margin = result / revenue` (percentage).
- `otherChargesTotal = production - material - labor` (used in Costs section).
- Ratios can be stored as percent (0-100) or ratio (0-1); normalize consistently.
- Deltas are month-over-month changes against previous report.

## Endpoints (expected usage)
- `GET /financial_reports?establishment_id=...&order_by=month&direction=desc`
- `GET /financial_reports?establishment_id=...&month=...` (detail)
- `GET /financial_ingredients?establishment_id=...&financial_report_id=...`
- `GET /financial_recipes?establishment_id=...&financial_report_id=...`
- `POST /financial_reports` (create/refresh via `financial_reports.py`)

## Important implementation notes
- `ReportCreateDialog` and `ReportEditDialog` are UI-only; replace toast stubs with API calls.
- Use the **latest report** as reference when computing deltas.
- Annexes require joins to display product/recipe names and categories.
- Keep formatting consistent: `fr-FR`, euro formatting, percent with sign, and safe `--` fallback for missing data.
