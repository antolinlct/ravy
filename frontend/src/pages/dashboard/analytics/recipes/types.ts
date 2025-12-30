export type RecipeCategory = {
  id: string
  name: string
}

export type RecipeSubcategory = {
  id: string
  name: string
  categoryId: string | null
}

export type RecipeSummary = {
  id: string
  name: string
  active: boolean
  saleable: boolean
  categoryId: string | null
  subcategoryId: string | null
  purchaseCostPerPortion: number | null
  priceExclTax: number | null
  currentMarginPercent: number | null
  updatedAt: string | null
}

export type RecipeMarginItem = {
  id: string
  name: string
  categoryId: string | null
  subcategoryId: string | null
  marginPercent: number | null
  costPerPortion: number | null
}

export type RecipeKpi = {
  id: string
  label: string
  value: number | null
  delta: number | null
  format: "currency" | "percent" | "number"
}

export type RecipeVariation = {
  id: string
  recipe: string
  marginPercent: number | null
  changePercent: number | null
}

export type RecipeMarginSeriesPoint = {
  date: Date
  value: number
}

export type RecipeIngredientRow = {
  id: string
  name: string
  type: "ARTICLE" | "SUBRECIPE" | "FIXED"
  quantity?: number | null
  unit?: string | null
  portions?: number | null
  weightShare?: number | null
  costStart?: number | null
  costEnd?: number | null
  impactEuro?: number | null
}

export type RecipeAnalysis = {
  id: string
  name: string
  purchaseCostPerPortion: number | null
  priceExclTax: number | null
  portions: number | null
}

export type RecipeHistoryPoint = {
  date: Date
  marginRatio: number | null
  costPerPortion: number | null
}
