export type SupplierLabel =
  | "FOOD"
  | "BEVERAGES"
  | "FIXED COSTS"
  | "VARIABLE COSTS"
  | "OTHER"

export type MercurialeRequest = {
  id: string
  createdAt: string
  establishment: string
  message: string
}

export type MercurialeSupplier = {
  id: string
  name: string
  label: SupplierLabel
  active: boolean
  mercurialLogoPath?: string | null
  marketSupplierId?: string | null
}

export type Mercuriale = {
  id: string
  supplierId: string
  name: string
  description?: string | null
  active: boolean
  effectiveFrom?: string | null
  effectiveTo?: string | null
  updatedAt?: string | null
}

export type MercurialeMasterArticle = {
  id: string
  supplierId: string
  name: string
  unit: string
  vatRate: number
  category: string
  subcategory: string
  raceName?: string | null
  description?: string | null
  active: boolean
}

export type MercurialeArticle = {
  id: string
  mercurialeId: string
  masterArticleId: string
  priceStandard?: number | null
  pricePlus?: number | null
  pricePremium?: number | null
  variation?: number | null
  active: boolean
}
