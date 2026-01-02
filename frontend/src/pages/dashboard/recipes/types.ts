export type RecipeStatus = "Active" | "Brouillon"

export type RecipeListItem = {
  id: string
  name: string
  ingredientsLabel: string
  status: RecipeStatus
  category: string
  subCategory: string
  portionCost: string
  salePrice: string | null
  margin: string | null
  marginValue: number | null
  updatedAt: Date | null
}

export type RecipeListCategoryOption = {
  value: string
  label: string
  categoryId?: string
}

export type IngredientType = "ARTICLE" | "SUBRECIPE" | "FIXED"
export type PriceMethod = "MULTIPLIER" | "PERCENTAGE" | "VALUE"

export type VatRateOption = {
  id: string
  label: string
  rate: number
}

export type RecipeCategoryOption = {
  id: string
  label: string
}

export type RecipeSubcategoryOption = {
  id: string
  label: string
  categoryId: string
}

export type SupplierOption = {
  id: string
  label: string
}

export type SupplierProductOption = {
  id: string
  label: string
  unit: string
  unitCost: number
}

export type RecipeDetail = {
  id: string
  name: string
  active: boolean
  saleable: boolean
  vatId: string
  recommendedRetailPrice: number
  portions: number
  portionWeightGrams: number | null
  priceInclTax: number | null
  categoryId: string
  subcategoryId: string
  updatedAt: Date
  containsSubRecipe?: boolean
  purchaseCostPerPortion?: number | null
  technicalDataSheetInstructions?: string
  technicalDataSheetImagePath?: string | null
}

export type Ingredient = {
  id: string
  type: IngredientType
  name: string
  quantity: number
  unit: string
  unitCost: number
  masterArticleId?: string
  supplierId?: string
  productId?: string
  wastePercent?: number
  subRecipeId?: string
}

export type IngredientEditorDraft =
  | {
      type: "ARTICLE"
      supplierId: string
      productId: string
      quantity: string
      wastePercent: string
    }
  | {
      type: "SUBRECIPE"
      categoryId: string
      subcategoryId: string
      recipeId: string
      portionsUsed: string
    }
  | {
      type: "FIXED"
      name: string
      fixedCost: string
    }

export type IngredientRow = Ingredient & {
  cost: number
  subtitle: string
}

export type RecipeDetailLocationState = {
  recipeId?: string
  recipe?: RecipeDetail
  ingredients?: Ingredient[]
  forceSaveOnEntry?: boolean
}
