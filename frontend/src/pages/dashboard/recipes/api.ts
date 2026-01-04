import api from "@/lib/axiosClient"
import type { IngredientType, PriceMethod } from "./types"

export type RecipePricePrefs = {
  method: PriceMethod
  value: number
}

export type ApiRecipe = {
  id: string
  establishment_id?: string | null
  name?: string | null
  vat_id?: string | null
  recommanded_retail_price?: number | null
  active?: boolean | null
  saleable?: boolean | null
  contains_sub_recipe?: boolean | null
  purchase_cost_total?: number | null
  portion?: number | null
  purchase_cost_per_portion?: number | null
  technical_data_sheet_instructions?: string | null
  current_margin?: number | null
  portion_weight?: number | null
  price_excl_tax?: number | null
  price_incl_tax?: number | null
  price_tax?: number | null
  category_id?: string | null
  subcategory_id?: string | null
  updated_at?: string | null
  created_at?: string | null
  technical_data_sheet_image_path?: string | null
}

export type ApiIngredient = {
  id: string
  recipe_id?: string | null
  type?: IngredientType | null
  master_article_id?: string | null
  subrecipe_id?: string | null
  unit_cost?: number | null
  quantity?: number | null
  unit?: string | null
  percentage_loss?: number | null
  gross_unit_price?: number | null
  establishment_id?: string | null
  updated_at?: string | null
  created_at?: string | null
}

export type ApiRecipeCategory = {
  id: string
  name?: string | null
  establishment_id?: string | null
}

export type ApiRecipeSubcategory = {
  id: string
  name?: string | null
  category_id?: string | null
  establishment_id?: string | null
}

export type ApiVatRate = {
  id: string
  name?: string | null
  percentage_rate?: number | null
  absolute_rate?: number | null
}

export type ApiSupplier = {
  id: string
  name?: string | null
  label?: string | null
  establishment_id?: string | null
}

export type ApiMasterArticle = {
  id: string
  name?: string | null
  unformatted_name?: string | null
  unit?: string | null
  current_unit_price?: number | null
  supplier_id?: string | null
  establishment_id?: string | null
}

type RecipesCache = {
  establishmentId: string
  data: ApiRecipe[]
  fetchedAt: number
}

let recipesCache: RecipesCache | null = null
const ingredientsCache: Record<string, ApiIngredient[]> = {}

export const getCachedRecipes = (estId: string) => {
  if (!recipesCache || recipesCache.establishmentId !== estId) return null
  return recipesCache.data
}

export const setCachedRecipes = (estId: string, data: ApiRecipe[]) => {
  recipesCache = {
    establishmentId: estId,
    data,
    fetchedAt: Date.now(),
  }
}

export const upsertCachedRecipe = (estId: string, recipe: ApiRecipe) => {
  if (!recipesCache || recipesCache.establishmentId !== estId) {
    setCachedRecipes(estId, [recipe])
    return
  }
  const next = recipesCache.data.filter((item) => item.id !== recipe.id)
  next.push(recipe)
  recipesCache = { ...recipesCache, data: next }
}

export const removeCachedRecipe = (estId: string, recipeId: string) => {
  if (!recipesCache || recipesCache.establishmentId !== estId) return
  recipesCache = {
    ...recipesCache,
    data: recipesCache.data.filter((item) => item.id !== recipeId),
  }
}

export const clearIngredientsCache = (estId: string, recipeId?: string) => {
  const keys = Object.keys(ingredientsCache)
  keys.forEach((key) => {
    if (!key.startsWith(`${estId}:`)) return
    if (recipeId && key !== `${estId}:${recipeId}` && key !== `${estId}:all`) return
    delete ingredientsCache[key]
  })
}

const DEFAULT_PREFS: RecipePricePrefs = {
  method: "MULTIPLIER",
  value: 3,
}

export const fetchRecipePricePrefs = async (estId: string): Promise<RecipePricePrefs> => {
  try {
    const res = await api.get(`/establishments/${estId}`)
    const data = res.data
    const method = (data?.recommended_retail_price_method as PriceMethod) ?? DEFAULT_PREFS.method
    const valueRaw = data?.recommended_retail_price_value
    const value = Number.isFinite(valueRaw) ? Number(valueRaw) : DEFAULT_PREFS.value
    return {
      method,
      value: Number.isFinite(value) && value > 0 ? value : DEFAULT_PREFS.value,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export const fetchRecipes = async (
  estId: string,
  options?: { useCache?: boolean }
): Promise<ApiRecipe[]> => {
  const useCache = options?.useCache ?? true
  if (useCache) {
    const cached = getCachedRecipes(estId)
    if (cached) return cached
  }
  const res = await api.get<ApiRecipe[]>("/recipes", {
    params: {
      establishment_id: estId,
      order_by: "name",
      direction: "asc",
      limit: 2000,
    },
  })
  const data = res.data ?? []
  setCachedRecipes(estId, data)
  return data
}

export const fetchRecipeById = async (recipeId: string): Promise<ApiRecipe | null> => {
  try {
    const res = await api.get<ApiRecipe>(`/recipes/${recipeId}`)
    return res.data ?? null
  } catch {
    return null
  }
}

export const fetchIngredients = async (
  estId: string,
  recipeId?: string,
  options?: { useCache?: boolean }
): Promise<ApiIngredient[]> => {
  const useCache = options?.useCache ?? true
  const cacheKey = `${estId}:${recipeId ?? "all"}`
  if (useCache && ingredientsCache[cacheKey]) {
    return ingredientsCache[cacheKey]
  }
  const res = await api.get<ApiIngredient[]>("/ingredients", {
    params: {
      establishment_id: estId,
      recipe_id: recipeId,
      order_by: "created_at",
      direction: "asc",
      limit: 2000,
    },
  })
  const data = res.data ?? []
  ingredientsCache[cacheKey] = data
  return data
}

export const fetchRecipeCategories = async (): Promise<ApiRecipeCategory[]> => {
  const res = await api.get<ApiRecipeCategory[]>("/recipe_categories", {
    params: {
      order_by: "created_at",
      direction: "asc",
      limit: 2000,
    },
  })
  return res.data ?? []
}

export const fetchRecipeSubcategories = async (): Promise<ApiRecipeSubcategory[]> => {
  const res = await api.get<ApiRecipeSubcategory[]>("/recipes_subcategories", {
    params: {
      order_by: "created_at",
      direction: "asc",
      limit: 2000,
    },
  })
  return res.data ?? []
}

export const fetchVatRates = async (): Promise<ApiVatRate[]> => {
  const res = await api.get<ApiVatRate[]>("/vat_rates", {
    params: {
      order_by: "percentage_rate",
      direction: "asc",
      limit: 200,
    },
  })
  return res.data ?? []
}

export const fetchSuppliers = async (estId: string): Promise<ApiSupplier[]> => {
  const res = await api.get<ApiSupplier[]>("/suppliers", {
    params: {
      establishment_id: estId,
      order_by: "name",
      direction: "asc",
      limit: 2000,
    },
  })
  return res.data ?? []
}

export const fetchMasterArticles = async (estId: string): Promise<ApiMasterArticle[]> => {
  const res = await api.get<ApiMasterArticle[]>("/master_articles", {
    params: {
      establishment_id: estId,
      order_by: "name",
      direction: "asc",
      limit: 4000,
    },
  })
  return res.data ?? []
}

export const createRecipe = async (payload: Partial<ApiRecipe>): Promise<ApiRecipe> => {
  const res = await api.post<ApiRecipe>("/recipes", payload)
  const data = res.data
  if (data?.establishment_id) {
    upsertCachedRecipe(String(data.establishment_id), data)
  }
  return data
}

export const updateRecipe = async (
  recipeId: string,
  payload: Partial<ApiRecipe>
): Promise<ApiRecipe> => {
  const res = await api.patch<ApiRecipe>(`/recipes/${recipeId}`, payload)
  const data = res.data
  if (data?.establishment_id) {
    upsertCachedRecipe(String(data.establishment_id), data)
  }
  return data
}

export const deleteRecipe = async (payload: {
  recipe_id: string
  establishment_id: string
  target_date?: string | null
}) => {
  const res = await api.post<{
    deleted_recipes?: string[]
    impacted_recipes?: string[]
    deleted_ingredient_ids?: string[]
  }>("/logic/write/delete-recipe", payload)
  return res.data
}

export const duplicateRecipe = async (payload: {
  recipe_id: string
  establishment_id: string
  new_name: string
  target_date?: string | null
}) => {
  const res = await api.post<{ new_recipe_id?: string }>("/logic/write/duplicate-recipe", payload)
  return res.data
}

export const recomputeRecipe = async (payload: {
  recipe_id: string
  establishment_id: string
  target_date?: string | null
}) => {
  return api.post("/logic/write/update-recipe", payload)
}

export const createIngredient = async (payload: Partial<ApiIngredient>): Promise<ApiIngredient> => {
  const res = await api.post<ApiIngredient>("/ingredients", payload)
  return res.data
}

export const updateIngredient = async (
  ingredientId: string,
  payload: Partial<ApiIngredient>
): Promise<ApiIngredient> => {
  const res = await api.patch<ApiIngredient>(`/ingredients/${ingredientId}`, payload)
  return res.data
}

export const deleteIngredient = async (payload: {
  ingredient_id: string
  establishment_id: string
  target_date?: string | null
}) => {
  return api.post("/logic/write/delete-ingredient", payload)
}

export const recomputeIngredient = async (payload: {
  ingredient_id: string
  recipe_id: string
  establishment_id: string
  target_date?: string | null
}) => {
  return api.post("/logic/write/update-ingredient", payload)
}

export type RecipePdfIngredient = {
  name?: string | null
  type?: string | null
  quantity?: number | null
  unit?: string | null
  unit_cost?: number | null
  loss_percent?: number | null
  portion_weight?: number | null
  supplier?: string | null
  product?: string | null
}

export type RecipePdfPayload = {
  recipe: ApiRecipe
  ingredients: RecipePdfIngredient[]
  include_financials: boolean
  technical_image_url?: string | null
  instructions_html?: string | null
}

export const generateRecipePdf = async (
  payload: RecipePdfPayload,
  options?: { signal?: AbortSignal }
): Promise<Blob> => {
  const res = await api.post("/pdf/recipes/generate", payload, {
    responseType: "blob",
    headers: {
      Accept: "application/pdf",
    },
    signal: options?.signal,
  })
  return res.data
}
