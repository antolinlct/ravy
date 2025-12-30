export type PricePoint = {
  date: string
  value: number
}

export type MarketSupplier = {
  id: string
  name?: string | null
  label?: string | null
  active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type MarketMasterArticle = {
  id: string
  market_supplier_id?: string | null
  name?: string | null
  unit?: string | null
  unformatted_name?: string | null
  current_unit_price?: number | null
  is_active?: boolean | null
}

export type MarketSeriesPoint = {
  date: string
  avg_unit_price: number
}

export type MarketProductStats = {
  avg_unit_price?: number | null
  min_unit_price?: number | null
  max_unit_price?: number | null
  last_unit_price?: number | null
  last_purchase_date?: string | null
  count_purchases?: number | null
  volatility_range?: string | null
  variation_euro?: number | null
  variation_percent?: number | null
  market_volatility_index?: number | null
  trend?: string | null
  days_since_last?: number | null
  is_good_time_to_buy?: boolean | null
}

export type MarketProductUser = {
  has_purchased?: boolean | null
  user_avg_unit_price?: number | null
  user_last_unit_price?: number | null
  user_vs_market_eur?: number | null
  user_vs_market_percent?: number | null
  potential_saving_eur?: number | null
  deal_score?: number | null
  recommendation_badge?: string | null
}

export type MarketProductOverview = {
  market_master_article?: MarketMasterArticle | null
  series_daily?: MarketSeriesPoint[]
  stats?: MarketProductStats
  user?: MarketProductUser
}

export type MarketSupplierBlock = {
  market_supplier?: MarketSupplier | null
  products?: MarketProductOverview[]
}

export type MarketOverviewResponse = {
  period?: { start?: string; end?: string }
  suppliers?: MarketSupplierBlock[]
}

export type MarketSupplierOption = {
  id: string
  label: string
  usedByUser: boolean
}

export type MarketProductOption = {
  id: string
  label: string
  supplierId: string
  unit: string
}

export type MarketGroupRow = {
  id: string
  rowType: "group"
  supplierId: string
  supplierLabel: string
  productCount: number
}

export type MarketProductRow = {
  id: string
  rowType: "product"
  productId: string
  supplierId: string
  supplierLabel: string
  productLabel: string
  unit: string
}

export type MarketGridRow = MarketGroupRow | MarketProductRow
