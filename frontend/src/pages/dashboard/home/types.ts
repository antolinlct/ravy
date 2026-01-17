export type InvoiceSummary = {
  count: number
  sumHt: number
  sumTva: number
  sumTtc: number
}

export type InvoiceStatItem = {
  name: string
  value: string
}

export type VariationRow = {
  id: string
  master_article_id: string
  date: string
  percentage: number
  old_unit_price?: number | null
  new_unit_price?: number | null
  is_deleted?: boolean | null
}

export type MasterArticleRow = {
  id: string
  name?: string | null
  unformatted_name?: string | null
  unit?: string | null
  supplier_id?: string | null
  market_master_article_id?: string | null
}

export type SupplierRow = {
  id: string
  name: string
}

export type FinancialReportRow = {
  id: string
  month: string
}

export type FinancialIngredientRow = {
  id: string
  financial_report_id?: string | null
  master_article_id?: string | null
  quantity?: number | null
  market_gap_value?: number | null
  market_gap_percentage?: number | null
  market_total_savings?: number | null
}

export type RecipeRow = {
  id: string
  name: string
  active: boolean
  saleable: boolean
  current_margin?: number | null
}

export type RecipeMarginRow = {
  id: string
  date: string
  average_margin?: number | null
}

export type LatestVariation = {
  id: string
  masterArticleId: string
  article: string
  supplier: string
  date: string
  unitPrice?: number | null
  changePercent: number
}

export type OptimizedProduct = {
  id: string
  name: string
  supplier: string
  unitPaid: number | null
  unitMarket: number | null
  monthlyQty: number
  unit: string
  monthlySavings: number
}

export type RecipeMarginItem = {
  id: string
  name: string
  marginValue: number | null
  active: boolean
  saleable: boolean
}

export type MarginSeriesPoint = {
  date: string
  value: number
}

export type HomeDashboardData = {
  invoiceStats: InvoiceStatItem[]
  latestVariations: LatestVariation[]
  optimizedProducts: OptimizedProduct[]
  totalMonthlySavings: number
  marginSeries: MarginSeriesPoint[]
  topLowMargin: RecipeMarginItem[]
  reportMonth?: string
}
