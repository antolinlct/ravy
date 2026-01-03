export type SupplierLabel = "FOOD" | "BEVERAGES" | "FIXED COSTS" | "VARIABLE COSTS" | "OTHER"

export type SupplierInfo = {
  id: string
  name: string
  label?: SupplierLabel | null
}

export type SupplierOption = {
  value: string
  label: string
}

export type InvoiceSummary = {
  id: string
  supplierId: string | null
  date: string | null
  totalHt: number
  totalTtc: number
}

export type ProductAggregate = {
  masterArticleId: string
  supplierId: string | null
  totalSpend: number
  totalQty: number
  avgUnitPrice: number
  unit?: string | null
  lastInvoiceDate?: string | null
}

export type FinancialIngredientInfo = {
  id: string
  masterArticleId: string | null
  quantity: number
  consumedValue: number
  marketGapValue: number
  marketGapPercentage: number
  marketTotalSavings: number
  marketBalanced: number
}

export type MasterArticleInfo = {
  id: string
  name: string
  supplierId: string | null
  unit?: string | null
  marketMasterArticleId?: string | null
}

export type VariationEntry = {
  id: string
  masterArticleId: string | null
  percentage: number | null
  date: string | null
}

export type MarketComparison = {
  statsUser: {
    avgPrice: number
    totalQty: number
  }
  statsMarket: {
    avgPrice: number
    minPrice: number | null
    maxPrice: number | null
  }
  comparison: {
    diffAvgPrice: number | null
    potentialSavings: number
  }
  marketUnit?: string | null
}

export type RecipeImpactRow = {
  id: string
  name: string
  costStart: number | null
  costEnd: number | null
  impactEuro: number | null
  isActive: boolean
  isSold: boolean
}

export type InvoiceRow = {
  id: string
  number: string
  items: number
  date: string
  ttc: number
}

export type AlternativeItem = {
  id: string
  name: string
  supplier: string
  price: number | null
}
