import { useCallback, useEffect, useMemo, useState } from "react"
import api from "@/lib/axiosClient"
import { useEstablishment } from "@/context/EstablishmentContext"
import type {
  FinancialIngredientRow,
  FinancialRecipeRow,
  FinancialReportRow,
  LiveScoreRow,
  MasterArticleRow,
  RecipeCategoryRow,
  RecipeRow,
  RecipeSubcategoryRow,
  ReportableRecipe,
  SupplierRow,
} from "./types"

type FinancialInputs = {
  laborCost: string
  headcount: string
  fixedCosts: string
  variableCosts: string
  otherCosts: string
  revenueFood: string
  revenueTotal: string
}

type FinancialReportSubmitParams = {
  establishmentId: string
  targetMonth: Date
  financialInputs: FinancialInputs
  salesByRecipe: Record<string, string>
}

type FinancialReportSubmitResponse = {
  id?: string | null
  month?: string | null
}

type PerformanceReportsState = {
  reports: FinancialReportRow[]
  reportableRecipes: ReportableRecipe[]
  isLoading: boolean
  error: string | null
  reload: () => void
}

type PerformanceScoresState = {
  reports: FinancialReportRow[]
  liveScores: LiveScoreRow[]
  globalRanking: { position: number; total: number } | null
  isLoading: boolean
  error: string | null
  reload: () => void
}

type PerformanceReportDetailState = {
  report: FinancialReportRow | null
  reports: FinancialReportRow[]
  financialIngredients: FinancialIngredientRow[]
  financialRecipes: FinancialRecipeRow[]
  masterArticles: MasterArticleRow[]
  suppliers: SupplierRow[]
  recipes: RecipeRow[]
  recipeCategories: RecipeCategoryRow[]
  recipeSubcategories: RecipeSubcategoryRow[]
  reportableRecipes: ReportableRecipe[]
  isLoading: boolean
  error: string | null
  reload: () => void
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toDate = (value?: string | null): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const normalizePercent = (value: number | null | undefined): number => {
  if (value === null || value === undefined) return 0
  return Math.abs(value) <= 1 ? value * 100 : value
}

export const parseLocaleNumber = (value: string): number => {
  if (!value.trim()) return 0
  const normalized = value.replace(/\s+/g, "").replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const toMonthKey = (value?: string | null): string | null => {
  const date = toDate(value)
  if (!date) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

const normalizeReport = (report: FinancialReportRow): FinancialReportRow => ({
  ...report,
  ca_total_ht: toNumber(report.ca_total_ht),
  ca_solid_ht: toNumber(report.ca_solid_ht),
  ca_liquid_ht: toNumber(report.ca_liquid_ht),
  ca_tracked_recipes_total: toNumber(report.ca_tracked_recipes_total),
  ca_tracked_recipes_ratio: toNumber(report.ca_tracked_recipes_ratio),
  ca_untracked_recipes_total: toNumber(report.ca_untracked_recipes_total),
  ca_untracked_recipes_ratio: toNumber(report.ca_untracked_recipes_ratio),
  material_cost_solid: toNumber(report.material_cost_solid),
  material_cost_liquid: toNumber(report.material_cost_liquid),
  material_cost_total: toNumber(report.material_cost_total),
  material_cost_ratio: toNumber(report.material_cost_ratio),
  material_cost_ratio_solid: toNumber(report.material_cost_ratio_solid),
  material_cost_ratio_liquid: toNumber(report.material_cost_ratio_liquid),
  labor_cost_total: toNumber(report.labor_cost_total),
  labor_cost_ratio: toNumber(report.labor_cost_ratio),
  fixed_charges_total: toNumber(report.fixed_charges_total),
  fixed_charges_ratio: toNumber(report.fixed_charges_ratio),
  variable_charges_total: toNumber(report.variable_charges_total),
  variable_charges_ratio: toNumber(report.variable_charges_ratio),
  other_charges_total: toNumber(report.other_charges_total),
  other_charges_ratio: toNumber(report.other_charges_ratio),
  production_cost_total: toNumber(report.production_cost_total),
  production_cost_ratio: toNumber(report.production_cost_ratio),
  commercial_margin_total: toNumber(report.commercial_margin_total),
  commercial_margin_total_ratio: toNumber(report.commercial_margin_total_ratio),
  commercial_margin_solid: toNumber(report.commercial_margin_solid),
  commercial_margin_solid_ratio: toNumber(report.commercial_margin_solid_ratio),
  commercial_margin_liquid: toNumber(report.commercial_margin_liquid),
  commercial_margin_liquid_ratio: toNumber(report.commercial_margin_liquid_ratio),
  ebitda: toNumber(report.ebitda),
  ebitda_ratio: toNumber(report.ebitda_ratio),
  break_even_point: toNumber(report.break_even_point),
  safety_margin: toNumber(report.safety_margin),
  safety_margin_ratio: toNumber(report.safety_margin_ratio),
  revenue_per_employee: toNumber(report.revenue_per_employee),
  result_per_employee: toNumber(report.result_per_employee),
  salary_per_employee: toNumber(report.salary_per_employee),
  avg_revenue_per_dish: toNumber(report.avg_revenue_per_dish),
  avg_cost_per_dish: toNumber(report.avg_cost_per_dish),
  avg_margin_per_dish: toNumber(report.avg_margin_per_dish),
  avg_margin_delta: toNumber(report.avg_margin_delta),
  theoretical_sales_solid: toNumber(report.theoretical_sales_solid),
  theoretical_material_cost_solid: toNumber(report.theoretical_material_cost_solid),
  multiplier_global: toNumber(report.multiplier_global),
  multiplier_solid: toNumber(report.multiplier_solid),
  multiplier_liquid: toNumber(report.multiplier_liquid),
  score_global: toNumber(report.score_global),
  score_financial: toNumber(report.score_financial),
  score_recipe: toNumber(report.score_recipe),
  score_purchase: toNumber(report.score_purchase),
  fte_count: toNumber(report.fte_count),
})

const fetchFinancialReports = async (estId: string): Promise<FinancialReportRow[]> => {
  const { data } = await api.get<FinancialReportRow[]>("/financial_reports", {
    params: {
      establishment_id: estId,
      order_by: "month",
      direction: "desc",
      limit: 200,
    },
  })
  const items = Array.isArray(data) ? data : []
  return items.map((item) => normalizeReport(item))
}

const fetchFinancialReport = async (reportId: string): Promise<FinancialReportRow | null> => {
  const { data } = await api.get<FinancialReportRow>(`/financial_reports/${reportId}`)
  if (!data) return null
  return normalizeReport(data)
}

const fetchLiveScores = async (params: Record<string, string | number | boolean | undefined>) => {
  const { data } = await api.get<LiveScoreRow[]>("/live_score", { params })
  return Array.isArray(data) ? data : []
}

const fetchFinancialIngredients = async (estId: string): Promise<FinancialIngredientRow[]> => {
  const { data } = await api.get<FinancialIngredientRow[]>("/financial_ingredients", {
    params: {
      establishment_id: estId,
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchFinancialRecipes = async (estId: string): Promise<FinancialRecipeRow[]> => {
  const { data } = await api.get<FinancialRecipeRow[]>("/financial_recipes", {
    params: {
      establishment_id: estId,
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchMasterArticles = async (estId: string): Promise<MasterArticleRow[]> => {
  const { data } = await api.get<MasterArticleRow[]>("/master_articles", {
    params: {
      establishment_id: estId,
      order_by: "unformatted_name",
      direction: "asc",
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchSuppliers = async (estId: string): Promise<SupplierRow[]> => {
  const { data } = await api.get<SupplierRow[]>("/suppliers", {
    params: {
      establishment_id: estId,
      order_by: "name",
      direction: "asc",
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchRecipes = async (estId: string): Promise<RecipeRow[]> => {
  const { data } = await api.get<RecipeRow[]>("/recipes", {
    params: {
      establishment_id: estId,
      order_by: "name",
      direction: "asc",
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchRecipeCategories = async (estId: string): Promise<RecipeCategoryRow[]> => {
  const { data } = await api.get<RecipeCategoryRow[]>("/recipe_categories", {
    params: {
      establishment_id: estId,
      order_by: "name",
      direction: "asc",
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchRecipeSubcategories = async (estId: string): Promise<RecipeSubcategoryRow[]> => {
  const { data } = await api.get<RecipeSubcategoryRow[]>("/recipes_subcategories", {
    params: {
      establishment_id: estId,
      order_by: "name",
      direction: "asc",
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const buildReportableRecipes = (recipes: RecipeRow[]): ReportableRecipe[] =>
  recipes
    .filter((recipe) => recipe.active && recipe.saleable)
    .map((recipe) => ({
      id: recipe.id,
      name: recipe.name ?? "Recette",
      price: toNumber(recipe.price_excl_tax) ?? 0,
    }))

export const submitFinancialReport = async ({
  establishmentId,
  targetMonth,
  financialInputs,
  salesByRecipe,
}: FinancialReportSubmitParams): Promise<FinancialReportSubmitResponse> => {
  const payload = Object.entries(salesByRecipe)
    .map(([recipeId, value]) => ({
      id: recipeId,
      sales_number: parseLocaleNumber(value),
    }))
    .filter((entry) => entry.sales_number > 0)

  const { data } = await api.post<FinancialReportSubmitResponse>("/logic/write/financial-report", {
    establishment_id: establishmentId,
    target_month: targetMonth.toISOString().slice(0, 10),
    payload,
    fte_count: parseLocaleNumber(financialInputs.headcount),
    fte_cost: parseLocaleNumber(financialInputs.laborCost),
    total_fixed_cost: parseLocaleNumber(financialInputs.fixedCosts),
    total_variable_cost: parseLocaleNumber(financialInputs.variableCosts),
    total_other_cost: parseLocaleNumber(financialInputs.otherCosts),
    total_revenue_excl_tax: parseLocaleNumber(financialInputs.revenueTotal),
    total_revenue_food_excl_tax: parseLocaleNumber(financialInputs.revenueFood),
  })

  return data ?? {}
}

export const usePerformanceReportsData = (): PerformanceReportsState => {
  const { estId } = useEstablishment()
  const [reports, setReports] = useState<FinancialReportRow[]>([])
  const [reportableRecipes, setReportableRecipes] = useState<ReportableRecipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!estId) {
      setReports([])
      setReportableRecipes([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const [reportsData, recipesData] = await Promise.all([
        fetchFinancialReports(estId),
        fetchRecipes(estId),
      ])
      setReports(reportsData)
      setReportableRecipes(buildReportableRecipes(recipesData))
    } catch {
      setError("Impossible de charger les rapports financiers.")
    } finally {
      setIsLoading(false)
    }
  }, [estId])

  useEffect(() => {
    load()
  }, [load])

  return {
    reports,
    reportableRecipes,
    isLoading,
    error,
    reload: load,
  }
}

export const usePerformanceScoresData = (): PerformanceScoresState => {
  const { estId } = useEstablishment()
  const [reports, setReports] = useState<FinancialReportRow[]>([])
  const [liveScores, setLiveScores] = useState<LiveScoreRow[]>([])
  const [globalRanking, setGlobalRanking] = useState<{ position: number; total: number } | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!estId) {
      setReports([])
      setLiveScores([])
      setGlobalRanking(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const [reportsData, liveScoreData, allScores] = await Promise.all([
        fetchFinancialReports(estId),
        fetchLiveScores({ establishment_id: estId, limit: 200 }),
        fetchLiveScores({ limit: 5000, order_by: "value", direction: "desc" }),
      ])
      setReports(reportsData)
      setLiveScores(liveScoreData)

      const globalScores = allScores.filter((score) => score.type === "global")
      const sortedGlobal = [...globalScores].sort(
        (a, b) => (toNumber(b.value) ?? 0) - (toNumber(a.value) ?? 0)
      )
      const total = sortedGlobal.length
      const position =
        sortedGlobal.findIndex((score) => score.establishment_id === estId) + 1
      setGlobalRanking(total ? { position: position || 1, total } : { position: 1, total: 1 })
    } catch {
      setError("Impossible de charger les scores.")
    } finally {
      setIsLoading(false)
    }
  }, [estId])

  useEffect(() => {
    load()
  }, [load])

  return {
    reports,
    liveScores,
    globalRanking,
    isLoading,
    error,
    reload: load,
  }
}

export const usePerformanceReportDetailData = (reportId?: string | null): PerformanceReportDetailState => {
  const { estId } = useEstablishment()
  const [report, setReport] = useState<FinancialReportRow | null>(null)
  const [reports, setReports] = useState<FinancialReportRow[]>([])
  const [financialIngredients, setFinancialIngredients] = useState<FinancialIngredientRow[]>([])
  const [financialRecipes, setFinancialRecipes] = useState<FinancialRecipeRow[]>([])
  const [masterArticles, setMasterArticles] = useState<MasterArticleRow[]>([])
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [recipes, setRecipes] = useState<RecipeRow[]>([])
  const [recipeCategories, setRecipeCategories] = useState<RecipeCategoryRow[]>([])
  const [recipeSubcategories, setRecipeSubcategories] = useState<RecipeSubcategoryRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!estId || !reportId) {
      setReport(null)
      setReports([])
      setFinancialIngredients([])
      setFinancialRecipes([])
      setMasterArticles([])
      setSuppliers([])
      setRecipes([])
      setRecipeCategories([])
      setRecipeSubcategories([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const [
        reportDetail,
        reportList,
        ingredientsData,
        recipesData,
        masterArticlesData,
        suppliersData,
        allRecipes,
        categoriesData,
        subcategoriesData,
      ] = await Promise.all([
        fetchFinancialReport(reportId),
        fetchFinancialReports(estId),
        fetchFinancialIngredients(estId),
        fetchFinancialRecipes(estId),
        fetchMasterArticles(estId),
        fetchSuppliers(estId),
        fetchRecipes(estId),
        fetchRecipeCategories(estId),
        fetchRecipeSubcategories(estId),
      ])
      setReport(reportDetail)
      setReports(reportList)
      setFinancialIngredients(ingredientsData)
      setFinancialRecipes(recipesData)
      setMasterArticles(masterArticlesData)
      setSuppliers(suppliersData)
      setRecipes(allRecipes)
      setRecipeCategories(categoriesData)
      setRecipeSubcategories(subcategoriesData)
    } catch {
      setError("Impossible de charger le rapport financier.")
    } finally {
      setIsLoading(false)
    }
  }, [estId, reportId])

  useEffect(() => {
    load()
  }, [load])

  const reportableRecipes = useMemo(() => buildReportableRecipes(recipes), [recipes])

  return {
    report,
    reports,
    financialIngredients,
    financialRecipes,
    masterArticles,
    suppliers,
    recipes,
    recipeCategories,
    recipeSubcategories,
    reportableRecipes,
    isLoading,
    error,
    reload: load,
  }
}

export const deleteFinancialReport = async (reportId: string) => {
  await api.delete(`/financial_reports/${reportId}`)
}

export const getReportMonthKey = (report: FinancialReportRow): string | null =>
  toMonthKey(report.month)

export const getReportMonthDate = (report: FinancialReportRow): Date | null => toDate(report.month)
