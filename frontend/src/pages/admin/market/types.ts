export type MarketSupplierLabel =
  | "FOOD"
  | "BEVERAGES"
  | "FIXED COSTS"
  | "VARIABLE COSTS"
  | "OTHER"

export type MarketSupplier = {
  id: string
  name: string
  label: MarketSupplierLabel | null
  active: boolean
  createdAt: string
  updatedAt: string | null
}

export type MarketMasterArticle = {
  id: string
  supplierId: string
  name: string
  unit: string | null
  unformattedName: string | null
  currentUnitPrice: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type MarketArticle = {
  id: string
  masterArticleId: string
  supplierId: string
  date: string
  unitPrice: number | null
  grossUnitPrice: number | null
  unit: string | null
  discounts: number | null
  dutiesAndTaxes: number | null
  quantity: number | null
  total: number | null
  establishmentId: string | null
  createdBy: string | null
  invoicePath: string | null
  invoiceId: string | null
  isActive: boolean
}

export type UserProfile = {
  id: string
  name: string
  email: string
}

export type Establishment = {
  id: string
  name: string
  city: string
}
