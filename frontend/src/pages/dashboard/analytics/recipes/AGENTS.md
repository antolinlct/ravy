Purpose
- Provide recipe analytics (overview + detail) with real data from backend read logic.
- No mock data in the UI: figures come from REST routes + read logic.

Files
- index.tsx: overview dashboard (recipes margin ticker, KPIs, average margin chart, recipe list).
- detail.tsx: recipe deep‑dive (margin series, cost per portion series, ingredient impact table).
- api.ts: all data fetching + mapping helpers + aggregation logic.
- types.ts: shared UI DTOs.
- components/AnalyticsPageHeader.tsx: shared header/tabs for overview/detail.
- components/VariationsSummaryCard.tsx: 30‑day variations ticker + KPIs.
- components/RecipeMarginsCard.tsx: filters + margin chart + recipe margin list.
- components/RecipeSelectionCard.tsx: category/subcategory/recipe selectors + date range.
- components/RecipeMarginDetailCard.tsx: margin chart + performance KPIs for the selected recipe.
- components/RecipeCostCard.tsx: cost chart + ingredients impact table.

Routes & contracts
- Recipes: GET /recipes (filters: establishment_id, order_by, direction).
- Recipe categories: GET /recipe_categories (filters: establishment_id, order_by, direction).
- Recipe subcategories: GET /recipes_subcategories (filters: establishment_id, order_by, direction).
- Margin series: GET /recipe_margin (filters: establishment_id, order_by=date asc).
- Recipe history: GET /history_recipes (filters: establishment_id, order_by=date asc).
- Recipe ingredients analysis: GET /recipes/{id}/ingredients-analysis (query: establishment_id, start_date, end_date).

Data mapping (api.ts)
- current_margin / average_margin / history margin can be stored as ratios (0–1) or percents (0–100).
  - normalizePercentValue -> percent (0–100) for overview cards/list.
  - normalizePercentRatio -> ratio (0–1) for charts that use Intl percent formatters.
- Recipe margin % falls back to (price_excl_tax - purchase_cost_per_portion) / price_excl_tax.
- history_recipes is returned without recipe_id filter in the API; we filter client‑side by recipe_id.
- Recipe ingredient analysis returns ARTICLE + SUBRECIPE only (FIXED is not emitted by the logic).
- Ingredient unit is not returned by the analysis route; UI displays quantity with unit fallback "".

Overview page (index.tsx)
- useRecipeOverviewData loads recipes, categories, subcategories, recipe_margin, history_recipes.
- Variations ticker uses history_recipes for last 30 days (first vs last margin per recipe).
- KPIs are averages across recipes; delta is computed from history first/last within the selected range.
- Average margin chart uses recipe_margin.average_margin series (percent values).

Detail page (detail.tsx)
- useRecipeCatalog drives category/subcategory/recipe selectors.
- useRecipeDetailData loads /recipes/{id}/ingredients-analysis and history_recipes to build:
  - margin series (ratio) for the main chart,
  - cost per portion series from history_recipes.purchase_cost_per_portion,
  - ingredient rows from analysis (costStart/costEnd from ingredient history).
- useRecipeMetrics computes overall + category average margin (ratio) for the KPI tiles.
- If the date range is empty, the analysis period returned by the backend seeds the picker.

Empty‑state & safety
- If no variations or no series, show an inline empty state (no demo data).
- Filters fall back to "__all__" to prevent empty select crashes.
- Cost/margin deltas guard against divide‑by‑zero and missing values.

Known mismatches / pitfalls
- history_recipes route does not accept recipe_id, so filtering is local.
- recipe_ingredients_analysis does not include unit; if unit is required, backend should include it.

Testing checklist
- Overview loads recipes + margins for the selected establishment.
- Ticker shows margin deltas for active + saleable recipes.
- Detail page auto‑selects the first recipe in filtered list.
- Margin and cost charts update when date range changes.
- Ingredient table shows weight share, start/end costs, variation, impact.
