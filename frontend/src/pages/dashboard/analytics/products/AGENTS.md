Purpose
- Provide product analytics overview and detail views for a restaurant (dashboard/analytics/products).
- No mock data: all figures are computed from backend read logic and REST routes.

Files
- index.tsx: overview dashboard (suppliers spend, top consumed products, variations ticker).
- detail.tsx: product deep‑dive (unit price series, market comparison, recipes impact, alternatives, invoices).
- api.ts: all data fetching + mapping helpers + aggregation logic (kept outside pages).
- types.ts: shared DTOs for UI.
- utils.ts: UI helper rules for tiering/alert colors.
- components/AnalyticsPageHeader.tsx: shared header/tabs for overview/detail.
- components/SupplierSpendCard.tsx: supplier spend filters + chart + spend list.
- components/VariationsTickerCard.tsx: variations ticker rendering + animation.
- components/ProductConsumptionCard.tsx: top products list + insight panel.
- components/ProductSelectionCard.tsx: supplier/product/date selectors for detail.
- components/ProductAnalysisCard.tsx: charts, KPIs, alert, and recipes impact table.
- components/ProductAlternativesCard.tsx: alternatives list with scroll fade.
- components/ProductInvoicesCard.tsx: invoice table, date parsing/formatting per row.

Routes & contracts
- Suppliers: GET /suppliers (filters: establishment_id, order_by, direction).
- Master articles: GET /master_articles (filters: establishment_id, supplier_id, order_by, direction).
- Invoices sum: GET /invoices/sum (filters: establishment_id, start_date, end_date, supplier_ids).
- Invoice details: GET /invoices/{id}/details (line items + quantity/unit/unit_price).
- Variations: GET /variations (filters: establishment_id, order_by=date desc).
- Master article analysis: GET /master-articles/{id}/analysis (period filters).
- Recipes impact: GET /master-articles/{id}/recipes-analysis (period filters).
- Alternatives: GET /master-articles/{id}/alternatives (score_min, limit).
- Market comparison: GET /market/articles/{id}/comparison (period filters).

Data mapping (api.ts)
- Supplier label uses label or label_id (enum: FOOD, BEVERAGES, FIXED COSTS, VARIABLE COSTS, OTHER).
- Master article display name uses name ?? unformatted_name; analysis uses name_raw/name/unformatted_name.
- Product aggregates are built from invoice details: totalSpend, totalQty, avgUnitPrice, unit, lastInvoiceDate.
- Market comparison returns avg/min/max market prices + user avg + total qty + potential savings.
- Recipes analysis returns per‑recipe cost impact (mapped to RecipeImpactRow).
- Alternatives return master_article + supplier + latest unit_price.
- Date handling: start/end passed as ISO yyyy‑mm‑dd (see toISODate).

Overview page (index.tsx)
- useProductOverviewData(estId, date range) loads suppliers, master articles, invoices/sum, variations,
  then fetches invoice details per invoice to build product aggregates.
- useMarketComparisons is called for top‑N products to compute delta vs. market.
- Supplier spend chart uses buildSupplierSeries to bucket invoice totals by day/week/month.
- Supplier list uses supplierExpenses (aggregated totals + invoice counts).
- Variations ticker uses /variations + master article names.
- If any chart series is empty, render a placeholder; AreaChartBlock otherwise renders default demo data.

Detail page (detail.tsx)
- useSuppliersList + useMasterArticlesList drive the comboboxes.
- useMasterArticleDetailData loads analysis, market comparison, recipes, alternatives, invoices,
  cost series, lastPurchaseDate, supplier share/spend.
- Unit label: selected master article unit → market comparison unit → "unité".
- Theoretical consumption: marketComparison.statsUser.totalQty → analysis.stats.total_quantity.
- Invoice dates can be ISO (yyyy‑mm‑dd) or dd/mm; parseInvoiceDate supports both.
- Selection is auto‑initialized to first supplier/article once data is available.

Empty‑state & safety
- Guard AreaChartBlock with a conditional; it uses default demo data when empty.
- Filter / invoices / suppliers by date range when computing totals and series.
- Avoid infinite state loops by only updating state when the next value differs.

Performance notes
- Overview loads invoice details for each invoice in range (Promise.allSettled); keep date
  ranges reasonable or add server‑side aggregation later.
- Market comparisons are fetched for top‑N only to limit calls.

Known mismatches / pitfalls
- Analysis logic refers to name_raw while contracts list unformatted_name; api.ts resolves both.
- Some suppliers may have null label; fallback label is "OTHER".

Testing checklist
- Overview shows supplier totals and variations when data exists.
- Detail page comboboxes load after suppliers/master articles fetch.
- Cost series renders only when analysis data exists.
- Alternatives and invoice tables show empty state when no rows.
