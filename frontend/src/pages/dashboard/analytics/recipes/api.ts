import { useCallback, useEffect, useMemo, useState } from "react"
import type { AreaChartPoint } from "@/components/blocks/area-chart"
import api from "@/lib/axiosClient"
import type {
  RecipeAnalysis,
  RecipeCategory,
  RecipeIngredientRow,
  RecipeKpi,
  RecipeMarginItem,
  RecipeSubcategory,
  RecipeSummary,
  RecipeVariation,
} from "./types"

type ApiRecipe = {
  id: string
  name?: string | null
  active?: boolean | null
  saleable?: boolean | null
  category_id?: string | null
  subcategory_id?: string | null
  purchase_cost_per_portion?: number | null
  price_excl_tax?: number | null
  current_margin?: number | null
  updated_at?: string | null
}

type ApiRecipeCategory = {
  id: string
  name?: string | null
}

type ApiRecipeSubcategory = {
  id: string
  name?: string | null
  category_id?: string | null
}

type ApiRecipeMargin = {
  id: string
  date?: string | null
  average_margin?: number | null
}

type ApiHistoryRecipe = {
  id: string
  recipe_id?: string | null
  date?: string | null
  margin?: number | null
  purchase_cost_per_portion?: number | null
  price_excl_tax?: number | null
}

type ApiIngredientHistory = {
  date?: string | null
  unit_cost?: number | null
}

type ApiRecipeAnalysisIngredient = {
  ingredient_id?: string
  ingredient_type?: string | null
  quantity?: number | null
  unit?: string | null
  unit_cost?: number | null
  cost_per_portion?: number | null
  percent_on_recipe_cost?: number | null
  impact_on_recipe_euro?: number | null
  history?: ApiIngredientHistory[] | null
  master_article?: {
    id?: string | null
    name_raw?: string | null
    name?: string | null
    unformatted_name?: string | null
  } | null
  subrecipe?: {
    id: string
    name?: string | null
    purchase_cost_per_portion?: number | null
    portion?: number | null
  } | null
}

type ApiRecipeAnalysisResponse = {
  recipe?: {
    id: string
    name?: string | null
    purchase_cost_per_portion?: number | null
    price_excl_tax?: number | null
    portion?: number | null
  } | null
  ingredients?: ApiRecipeAnalysisIngredient[] | null
  period?: {
    start?: string | null
    end?: string | null
  } | null
  error?: string
}

type RecipeAnalysisPayload = {
  analysis: RecipeAnalysis | null
  ingredients: RecipeIngredientRow[]
  period: { start: Date | null; end: Date | null } | null
  marginSeries: AreaChartPoint[]
  costSeries: AreaChartPoint[]
}

type DatedPoint = AreaChartPoint & { date: Date; value: number }

type CacheEntry<T> = {
  data: T
  fetchedAt: number
}

const CATALOG_CACHE_TTL = 5 * 60 * 1000
const OVERVIEW_CACHE_TTL = 2 * 60 * 1000
const DETAIL_CACHE_TTL = 60 * 1000

const recipeCatalogCache = new Map<string, CacheEntry<RecipeSummary[]>>()
let categoryCatalogCache: CacheEntry<RecipeCategory[]> | null = null
let subcategoryCatalogCache: CacheEntry<RecipeSubcategory[]> | null = null

const historyCacheByEst = new Map<string, CacheEntry<ApiHistoryRecipe[]>>()
const marginCacheByEst = new Map<string, CacheEntry<ApiRecipeMargin[]>>()
const analysisCache = new Map<string, CacheEntry<ApiRecipeAnalysisResponse>>()

const isFresh = <T>(entry: CacheEntry<T> | null, ttl: number) =>
  Boolean(entry && Date.now() - entry.fetchedAt < ttl)

const makeAnalysisKey = (
  estId: string,
  recipeId: string,
  startDate?: Date,
  endDate?: Date
) => `${estId}:${recipeId}:${toISODate(startDate) ?? "all"}:${toISODate(endDate) ?? "all"}`

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toDate = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const toISODate = (value?: Date) => {
  if (!value || Number.isNaN(value.getTime())) return undefined
  return value.toISOString().slice(0, 10)
}

const normalizePercentValue = (value: number | null) => {
  if (value === null) return null
  if (Math.abs(value) <= 1) return value * 100
  return value
}

const normalizePercentRatio = (value: number | null) => {
  if (value === null) return null
  if (Math.abs(value) > 1) return value / 100
  return value
}

const computeMarginRatio = (price: number | null, cost: number | null) => {
  if (!price || !Number.isFinite(price) || price === 0) return null
  if (cost === null || !Number.isFinite(cost)) return null
  return (price - cost) / price
}

const resolveRecipeMarginPercent = (recipe: RecipeSummary) => {
  if (recipe.currentMarginPercent !== null && recipe.currentMarginPercent !== undefined) {
    return recipe.currentMarginPercent
  }
  const ratio = computeMarginRatio(recipe.priceExclTax, recipe.purchaseCostPerPortion)
  return ratio === null ? null : ratio * 100
}

const resolveRecipeMarginRatio = (recipe: RecipeSummary) => {
  const percent = resolveRecipeMarginPercent(recipe)
  if (percent === null) return null
  return percent / 100
}

const resolveRecipeName = (recipe: ApiRecipe) => recipe.name ?? "Recette"

const resolveIngredientName = (ingredient: ApiRecipeAnalysisIngredient) => {
  if (ingredient.ingredient_type === "SUBRECIPE") {
    return ingredient.subrecipe?.name ?? "Sous-recette"
  }
  if (ingredient.ingredient_type === "FIXED") {
    return ingredient.unit ?? "Charge fixe"
  }
  return (
    ingredient.master_article?.name ??
    ingredient.master_article?.unformatted_name ??
    "Ingrédient"
  )
}

const buildMarginSeries = (rows: ApiRecipeMargin[]): AreaChartPoint[] => {
  const points: DatedPoint[] = rows
    .map((row): DatedPoint | null => {
      const date = toDate(row.date)
      const value = normalizePercentValue(toNumber(row.average_margin))
      if (!date || value === null) return null
      return { date, value }
    })
    .filter((item): item is DatedPoint => item !== null)

  points.sort((a, b) => a.date.getTime() - b.date.getTime())
  return points
}

const computeAverage = (values: Array<number | null>) => {
  const valid = values.filter((value): value is number => typeof value === "number" && !Number.isNaN(value))
  if (!valid.length) return null
  return valid.reduce((acc, value) => acc + value, 0) / valid.length
}

const buildRecipeMarginItems = (recipes: RecipeSummary[]): RecipeMarginItem[] => {
  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    categoryId: recipe.categoryId,
    subcategoryId: recipe.subcategoryId,
    marginPercent: resolveRecipeMarginPercent(recipe),
    costPerPortion: recipe.purchaseCostPerPortion,
  }))
}

const buildHistoryMap = (rows: ApiHistoryRecipe[], startDate?: Date, endDate?: Date) => {
  const filtered = rows
    .map((row) => ({ ...row, dateValue: toDate(row.date) }))
    .filter((row) => row.dateValue)
    .filter((row) => {
      if (startDate && row.dateValue && row.dateValue < startDate) return false
      if (endDate && row.dateValue && row.dateValue > endDate) return false
      return true
    })
    .sort((a, b) => (a.dateValue?.getTime() ?? 0) - (b.dateValue?.getTime() ?? 0))

  const firstMap = new Map<string, ApiHistoryRecipe>()
  const lastMap = new Map<string, ApiHistoryRecipe>()

  filtered.forEach((row) => {
    const recipeId = row.recipe_id
    if (!recipeId) return
    if (!firstMap.has(recipeId)) {
      firstMap.set(recipeId, row)
    }
    lastMap.set(recipeId, row)
  })

  return { firstMap, lastMap }
}

export const buildRecipeKpis = (
  recipes: RecipeSummary[],
  historyRows: ApiHistoryRecipe[],
  marginSeries: AreaChartPoint[],
  startDate?: Date,
  endDate?: Date
): RecipeKpi[] => {
  const avgCost = computeAverage(recipes.map((recipe) => recipe.purchaseCostPerPortion))
  const avgPrice = computeAverage(recipes.map((recipe) => recipe.priceExclTax))
  const avgMarginEuro = computeAverage(
    recipes.map((recipe) => {
      if (recipe.priceExclTax === null || recipe.purchaseCostPerPortion === null) return null
      return recipe.priceExclTax - recipe.purchaseCostPerPortion
    })
  )
  const filteredMarginSeries = marginSeries.filter((point) => {
    const d = point.date instanceof Date ? point.date : new Date(point.date ?? "")
    if (!d || Number.isNaN(d.getTime())) return false
    if (startDate && d < startDate) return false
    if (endDate && d > endDate) return false
    return true
  })
  const lastMarginPoint = filteredMarginSeries[filteredMarginSeries.length - 1]
  const avgMarginPercent =
    typeof lastMarginPoint?.value === "number"
      ? lastMarginPoint.value
      : computeAverage(recipes.map(resolveRecipeMarginPercent))

  let deltaCost: number | null = null
  let deltaPrice: number | null = null
  let deltaMarginEuro: number | null = null
  let deltaMarginPercent: number | null = null

  if (historyRows.length) {
    const { firstMap, lastMap } = buildHistoryMap(historyRows, startDate, endDate)

    let count = 0
    let sumFirstCost = 0
    let sumLastCost = 0
    let sumFirstPrice = 0
    let sumLastPrice = 0
    let sumFirstMarginEuro = 0
    let sumLastMarginEuro = 0

    lastMap.forEach((lastRow, recipeId) => {
      const firstRow = firstMap.get(recipeId)
      if (!firstRow) return

      const firstCost = toNumber(firstRow.purchase_cost_per_portion)
      const lastCost = toNumber(lastRow.purchase_cost_per_portion)
      const firstPrice = toNumber(firstRow.price_excl_tax)
      const lastPrice = toNumber(lastRow.price_excl_tax)
      const firstMarginRatio =
        normalizePercentRatio(toNumber(firstRow.margin)) ?? computeMarginRatio(firstPrice, firstCost)
      const lastMarginRatio =
        normalizePercentRatio(toNumber(lastRow.margin)) ?? computeMarginRatio(lastPrice, lastCost)

      if (
        firstCost === null ||
        lastCost === null ||
        firstPrice === null ||
        lastPrice === null ||
        firstMarginRatio === null ||
        lastMarginRatio === null
      ) {
        return
      }

      count += 1
      sumFirstCost += firstCost
      sumLastCost += lastCost
      sumFirstPrice += firstPrice
      sumLastPrice += lastPrice
      sumFirstMarginEuro += firstPrice - firstCost
      sumLastMarginEuro += lastPrice - lastCost
    })

    if (count > 0) {
      const avgFirstCost = sumFirstCost / count
      const avgLastCost = sumLastCost / count
      const avgFirstPrice = sumFirstPrice / count
      const avgLastPrice = sumLastPrice / count
      const avgFirstMarginEuro = sumFirstMarginEuro / count
      const avgLastMarginEuro = sumLastMarginEuro / count
      deltaCost = avgFirstCost !== 0 ? (avgLastCost - avgFirstCost) / avgFirstCost : null
      deltaPrice = avgFirstPrice !== 0 ? (avgLastPrice - avgFirstPrice) / avgFirstPrice : null
      deltaMarginEuro = avgFirstMarginEuro !== 0 ? (avgLastMarginEuro - avgFirstMarginEuro) / avgFirstMarginEuro : null
    }
  }

  if (filteredMarginSeries.length >= 2) {
    const firstPoint = filteredMarginSeries[0]
    const lastPoint = filteredMarginSeries[filteredMarginSeries.length - 1]
    const firstValue = typeof firstPoint.value === "number" ? firstPoint.value : null
    const lastValue = typeof lastPoint.value === "number" ? lastPoint.value : null
    if (firstValue !== null && lastValue !== null && firstValue !== 0) {
      deltaMarginPercent = (lastValue - firstValue) / firstValue
    }
  }

  return [
    {
      id: "avg_cost",
      label: "Coût d'achat moyen",
      value: avgCost,
      delta: deltaCost,
      format: "currency",
    },
    {
      id: "avg_price",
      label: "Prix de vente moyen",
      value: avgPrice,
      delta: deltaPrice,
      format: "currency",
    },
    {
      id: "avg_margin_euro",
      label: "Marge moyenne (€)",
      value: avgMarginEuro,
      delta: deltaMarginEuro,
      format: "currency",
    },
    {
      id: "avg_margin_percent",
      label: "Marge moyenne (%)",
      value: avgMarginPercent,
      delta: deltaMarginPercent,
      format: "percent",
    },
  ]
}

const buildRecipeVariations = (
  recipes: RecipeSummary[],
  historyRows: ApiHistoryRecipe[]
): RecipeVariation[] => {
  if (!historyRows.length) return []

  const now = new Date()
  const start = new Date(now)
  start.setDate(now.getDate() - 30)

  const { firstMap, lastMap } = buildHistoryMap(historyRows, start, now)
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]))
  const variations: RecipeVariation[] = []

  lastMap.forEach((lastRow, recipeId) => {
    const recipe = recipeMap.get(recipeId)
    if (!recipe || !recipe.active || !recipe.saleable) return
    const firstRow = firstMap.get(recipeId)
    if (!firstRow) return

    const firstMarginRatio =
      normalizePercentRatio(toNumber(firstRow.margin)) ??
      computeMarginRatio(toNumber(firstRow.price_excl_tax), toNumber(firstRow.purchase_cost_per_portion))
    const lastMarginRatio =
      normalizePercentRatio(toNumber(lastRow.margin)) ??
      computeMarginRatio(toNumber(lastRow.price_excl_tax), toNumber(lastRow.purchase_cost_per_portion))

    if (firstMarginRatio === null || lastMarginRatio === null) return

    const changePercent = (lastMarginRatio - firstMarginRatio) * 100

    variations.push({
      id: recipeId,
      recipe: recipe.name,
      marginPercent: lastMarginRatio * 100,
      changePercent,
    })
  })

  return variations
    .sort((a, b) => Math.abs(b.changePercent ?? 0) - Math.abs(a.changePercent ?? 0))
    .slice(0, 12)
}

export const useRecipeCatalog = (estId?: string | null) => {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [subcategories, setSubcategories] = useState<RecipeSubcategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      const cachedRecipes = estId ? recipeCatalogCache.get(estId) : null
      const cachedCategories = categoryCatalogCache
      const cachedSubcategories = subcategoryCatalogCache

      if (cachedRecipes) setRecipes(cachedRecipes.data)
      if (cachedCategories) setCategories(cachedCategories.data)
      if (cachedSubcategories) setSubcategories(cachedSubcategories.data)

      const shouldFetchRecipes = Boolean(estId) && !isFresh(cachedRecipes, CATALOG_CACHE_TTL)
      const shouldFetchCategories = !isFresh(cachedCategories, CATALOG_CACHE_TTL)
      const shouldFetchSubcategories = !isFresh(cachedSubcategories, CATALOG_CACHE_TTL)
      const shouldFetch = shouldFetchRecipes || shouldFetchCategories || shouldFetchSubcategories

      const hasCached =
        Boolean(cachedRecipes?.data.length) ||
        Boolean(cachedCategories?.data.length) ||
        Boolean(cachedSubcategories?.data.length)

      setIsLoading(shouldFetch && !hasCached)
      setError(null)
      if (!shouldFetch) return

      try {
        const [categoriesRes, subcategoriesRes, recipesRes] = await Promise.all([
          api.get<ApiRecipeCategory[]>("/recipe_categories", {
            params: {
              order_by: "created_at",
              direction: "asc",
              limit: 500,
            },
          }),
          api.get<ApiRecipeSubcategory[]>("/recipes_subcategories", {
            params: {
              order_by: "created_at",
              direction: "asc",
              limit: 1000,
            },
          }),
          estId
            ? api.get<ApiRecipe[]>("/recipes", {
                params: {
                  establishment_id: estId,
                  order_by: "name",
                  direction: "asc",
                  limit: 2000,
                },
              })
            : Promise.resolve({ data: [] as ApiRecipe[] }),
        ])

        if (!active) return

        const recipeList = recipesRes.data ?? []
        const categoriesList = categoriesRes.data ?? []
        const subcategoriesList = subcategoriesRes.data ?? []

        const mappedRecipes = recipeList.map((recipe) => ({
          id: recipe.id,
          name: resolveRecipeName(recipe),
          active: recipe.active ?? false,
          saleable: recipe.saleable ?? false,
          categoryId: recipe.category_id ?? null,
          subcategoryId: recipe.subcategory_id ?? null,
          purchaseCostPerPortion: toNumber(recipe.purchase_cost_per_portion),
          priceExclTax: toNumber(recipe.price_excl_tax),
          currentMarginPercent: normalizePercentValue(toNumber(recipe.current_margin)),
          updatedAt: recipe.updated_at ?? null,
        }))

        const mappedCategories = categoriesList.map((category) => ({
          id: category.id,
          name: category.name ?? "Catégorie",
        }))

        const mappedSubcategories = subcategoriesList.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.name ?? "Sous-catégorie",
          categoryId: subcategory.category_id ?? null,
        }))

        if (estId) recipeCatalogCache.set(estId, { data: mappedRecipes, fetchedAt: Date.now() })
        categoryCatalogCache = { data: mappedCategories, fetchedAt: Date.now() }
        subcategoryCatalogCache = { data: mappedSubcategories, fetchedAt: Date.now() }

        setRecipes(mappedRecipes)
        setCategories(mappedCategories)
        setSubcategories(mappedSubcategories)
      } catch {
        if (active) {
          setError("Impossible de charger les recettes.")
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [estId])

  return { recipes, categories, subcategories, isLoading, error }
}

export const useRecipeOverviewData = (
  estId?: string | null,
  startDate?: Date,
  endDate?: Date
) => {
  const { recipes, categories, subcategories } = useRecipeCatalog(estId)
  const [marginRows, setMarginRows] = useState<ApiRecipeMargin[]>([])
  const [historyRows, setHistoryRows] = useState<ApiHistoryRecipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!estId) return
    const cachedMargin = marginCacheByEst.get(estId)
    const cachedHistory = historyCacheByEst.get(estId)

    if (cachedMargin) setMarginRows(cachedMargin.data)
    if (cachedHistory) setHistoryRows(cachedHistory.data)

    const shouldFetchMargin = !isFresh(cachedMargin, OVERVIEW_CACHE_TTL)
    const shouldFetchHistory = !isFresh(cachedHistory, OVERVIEW_CACHE_TTL)
    const shouldFetch = shouldFetchMargin || shouldFetchHistory
    const hasCached = Boolean(cachedMargin?.data.length) || Boolean(cachedHistory?.data.length)

    setIsLoading(shouldFetch && !hasCached)
    setError(null)
    if (!shouldFetch) return
    try {
      const [marginRes, historyRes] = await Promise.all([
        api.get<ApiRecipeMargin[]>("/recipe_margin", {
          params: {
            establishment_id: estId,
            order_by: "date",
            direction: "asc",
            limit: 2000,
          },
        }),
        api.get<ApiHistoryRecipe[]>("/history_recipes", {
          params: {
            establishment_id: estId,
            order_by: "date",
            direction: "asc",
            limit: 4000,
          },
        }),
      ])

      const nextMargin = marginRes.data ?? []
      const nextHistory = historyRes.data ?? []

      marginCacheByEst.set(estId, { data: nextMargin, fetchedAt: Date.now() })
      historyCacheByEst.set(estId, { data: nextHistory, fetchedAt: Date.now() })

      setMarginRows(nextMargin)
      setHistoryRows(nextHistory)
    } catch {
      setError("Impossible de charger les analyses recettes.")
    } finally {
      setIsLoading(false)
    }
  }, [estId])

  useEffect(() => {
    load()
  }, [load])

  const marginSeries = useMemo(() => buildMarginSeries(marginRows), [marginRows])
  const marginItems = useMemo(() => buildRecipeMarginItems(recipes), [recipes])
  const kpis = useMemo(
    () => buildRecipeKpis(recipes, historyRows, marginSeries, startDate, endDate),
    [recipes, historyRows, marginSeries, startDate, endDate]
  )
  const variations = useMemo(() => buildRecipeVariations(recipes, historyRows), [recipes, historyRows])

  return {
    recipes,
    categories,
    subcategories,
    historyRows,
    marginSeries,
    marginItems,
    kpis,
    variations,
    isLoading,
    error,
  }
}

export const useRecipeDetailData = (
  estId: string | null | undefined,
  recipeId: string | null | undefined,
  startDate?: Date,
  endDate?: Date
): RecipeAnalysisPayload & { isLoading: boolean } => {
  const [analysis, setAnalysis] = useState<RecipeAnalysis | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredientRow[]>([])
  const [period, setPeriod] = useState<{ start: Date | null; end: Date | null } | null>(null)
  const [marginSeries, setMarginSeries] = useState<AreaChartPoint[]>([])
  const [costSeries, setCostSeries] = useState<AreaChartPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!estId || !recipeId) {
      setAnalysis(null)
      setIngredients([])
      setPeriod(null)
      setMarginSeries([])
      setCostSeries([])
      return
    }

    let active = true

    const analysisKey = makeAnalysisKey(estId, recipeId, startDate, endDate)
    const cachedAnalysis = analysisCache.get(analysisKey)
    const cachedHistory = historyCacheByEst.get(estId)
    const analysisIsFresh = isFresh(cachedAnalysis, DETAIL_CACHE_TTL)
    const historyIsFresh = isFresh(cachedHistory, OVERVIEW_CACHE_TTL)

    const applyPayload = (analysisData: ApiRecipeAnalysisResponse, historyData: ApiHistoryRecipe[]) => {
      const hasAnalysisError = Boolean(analysisData?.error)
      const recipe = hasAnalysisError ? null : analysisData.recipe ?? null
      const recipePortions = toNumber(recipe?.portion) ?? 1
      const mappedAnalysis: RecipeAnalysis | null = recipe
        ? {
            id: recipe.id,
            name: recipe.name ?? "Recette",
            purchaseCostPerPortion: toNumber(recipe.purchase_cost_per_portion),
            priceExclTax: toNumber(recipe.price_excl_tax),
            portions: toNumber(recipe.portion),
          }
        : null

      const mappedIngredients = hasAnalysisError
        ? []
        : (analysisData.ingredients ?? []).map((ingredient, index) => {
            const ingredientType = (ingredient.ingredient_type ?? "FIXED").toUpperCase()
            const normalizedType =
              ingredientType === "ARTICLE" || ingredientType === "SUBRECIPE" ? ingredientType : "FIXED"
            const quantity = toNumber(ingredient.quantity)
            const costPerPortion = toNumber(ingredient.cost_per_portion)
            const weightShare = normalizePercentRatio(toNumber(ingredient.percent_on_recipe_cost))
            const impactEuro = toNumber(ingredient.impact_on_recipe_euro)
            const history = ingredient.history ?? []
            const firstHistory = history[0]
            const lastHistory = history[history.length - 1]
            const firstPrice = toNumber(firstHistory?.unit_cost)
            const lastPrice = toNumber(lastHistory?.unit_cost)

            const calcCostStart =
              firstPrice !== null && quantity !== null
                ? (firstPrice * quantity) / recipePortions
                : costPerPortion
            const calcCostEnd =
              lastPrice !== null && quantity !== null
                ? (lastPrice * quantity) / recipePortions
                : costPerPortion

            return {
              id:
                ingredient.ingredient_id ??
                ingredient.subrecipe?.id ??
                ingredient.master_article?.name_raw ??
                `${normalizedType}-${index}`,
              name: resolveIngredientName(ingredient),
              type: normalizedType as "ARTICLE" | "SUBRECIPE" | "FIXED",
              masterArticleId: ingredient.master_article?.id ?? null,
              subrecipeId: ingredient.subrecipe?.id ?? null,
              quantity: quantity,
              unit: ingredient.unit ?? null,
              portions: ingredient.subrecipe?.portion ?? null,
              weightShare,
              costStart: calcCostStart,
              costEnd: calcCostEnd,
              impactEuro,
            }
          })

      const periodStart = toDate(analysisData.period?.start)
      const periodEnd = toDate(analysisData.period?.end)
      setAnalysis(mappedAnalysis)
      setIngredients(mappedIngredients)
      setPeriod(periodStart || periodEnd ? { start: periodStart, end: periodEnd } : null)

      const historyRows = historyData.filter((row) => row.recipe_id === recipeId)
      const marginPoints: DatedPoint[] = []
      const costPoints: DatedPoint[] = []
      historyRows.forEach((row) => {
        const date = toDate(row.date)
        if (!date) return
        const cost = toNumber(row.purchase_cost_per_portion)
        const price = toNumber(row.price_excl_tax)
        const marginRatio =
          normalizePercentRatio(toNumber(row.margin)) ?? computeMarginRatio(price, cost)

        if (typeof marginRatio === "number") {
          marginPoints.push({ date, value: marginRatio })
        }
        if (typeof cost === "number") {
          costPoints.push({ date, value: cost })
        }
      })
      marginPoints.sort((a, b) => a.date.getTime() - b.date.getTime())
      costPoints.sort((a, b) => a.date.getTime() - b.date.getTime())
      setMarginSeries(marginPoints)
      setCostSeries(costPoints)
    }

    if (analysisIsFresh) {
      applyPayload(cachedAnalysis?.data ?? {}, cachedHistory?.data ?? [])
    } else if (cachedAnalysis) {
      applyPayload(cachedAnalysis.data, cachedHistory?.data ?? [])
    }

    const load = async () => {
      const shouldFetchAnalysis = !analysisIsFresh
      const shouldFetchHistory = !historyIsFresh
      const shouldFetch = shouldFetchAnalysis || shouldFetchHistory

      setIsLoading(shouldFetchAnalysis && !cachedAnalysis)
      if (!shouldFetch) return
      try {
        const analysisPromise = shouldFetchAnalysis
          ? api.get<ApiRecipeAnalysisResponse>(`/recipes/${recipeId}/ingredients-analysis`, {
              params: {
                establishment_id: estId,
                start_date: toISODate(startDate),
                end_date: toISODate(endDate),
              },
            })
          : Promise.resolve({ data: cachedAnalysis?.data ?? {} })
        const historyPromise = shouldFetchHistory
          ? api.get<ApiHistoryRecipe[]>("/history_recipes", {
              params: {
                establishment_id: estId,
                order_by: "date",
                direction: "asc",
                limit: 4000,
              },
            })
          : Promise.resolve({ data: cachedHistory?.data ?? [] })

        const [analysisResult, historyResult] = await Promise.allSettled([
          analysisPromise,
          historyPromise,
        ])

        if (!active) return

        const analysisData =
          analysisResult.status === "fulfilled" ? analysisResult.value.data ?? {} : {}
        const historyData =
          historyResult.status === "fulfilled" ? historyResult.value.data ?? [] : []

        if (analysisResult.status === "fulfilled") {
          analysisCache.set(analysisKey, { data: analysisData, fetchedAt: Date.now() })
        }
        if (historyResult.status === "fulfilled") {
          historyCacheByEst.set(estId, { data: historyData, fetchedAt: Date.now() })
        }

        applyPayload(analysisData, historyData)
      } catch {
        if (active && !cachedAnalysis) {
          setAnalysis(null)
          setIngredients([])
          setPeriod(null)
          setMarginSeries([])
          setCostSeries([])
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [endDate, estId, recipeId, startDate])

  return { analysis, ingredients, period, marginSeries, costSeries, isLoading }
}

export const useRecipeMetrics = (recipes: RecipeSummary[], categoryId: string | null) => {
  return useMemo(() => {
    const overallMargins = recipes.map(resolveRecipeMarginRatio).filter((value): value is number => value !== null)
    const overallAvg = computeAverage(overallMargins.map((value) => value * 100))

    const categoryMargins = recipes
      .filter((recipe) => (categoryId ? recipe.categoryId === categoryId : true))
      .map(resolveRecipeMarginRatio)
      .filter((value): value is number => value !== null)
    const categoryAvg = computeAverage(categoryMargins.map((value) => value * 100))

    return {
      overallMarginRatio: overallAvg !== null ? overallAvg / 100 : null,
      categoryMarginRatio: categoryAvg !== null ? categoryAvg / 100 : null,
    }
  }, [recipes, categoryId])
}

export { normalizePercentRatio, resolveRecipeMarginRatio }
