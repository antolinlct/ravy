import { useCallback, useEffect, useMemo, useState } from "react"
import api from "@/lib/axiosClient"
import { useEstablishment } from "@/context/EstablishmentContext"
import type {
  FinancialIngredientRow,
  FinancialReportRow,
  HomeDashboardData,
  InvoiceStatItem,
  InvoiceSummary,
  LatestVariation,
  MarginSeriesPoint,
  MasterArticleRow,
  OptimizedProduct,
  RecipeMarginItem,
  RecipeMarginRow,
  RecipeRow,
  SupplierRow,
  VariationRow,
} from "./types"

const EMPTY_DATA: HomeDashboardData = {
  invoiceStats: [],
  latestVariations: [],
  optimizedProducts: [],
  totalMonthlySavings: 0,
  marginSeries: [],
  topLowMargin: [],
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizePercent = (value: number | null) => {
  if (value === null) return null
  if (Math.abs(value) <= 1) return value * 100
  return value
}

const formatMonthLabel = (raw?: string) => {
  const base = raw ? new Date(raw) : new Date()
  const formatted = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(base)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const getMonthBounds = (raw?: string) => {
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

const formatPercentValue = (value: number | null) => {
  if (value === null) return "--"
  const formatter = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${formatter.format(value)}%`
}

const formatCurrencyValue = (value: number | null) => {
  if (value === null) return "--"
  const formatter = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return `${formatter.format(Math.round(value))} €`
}

const formatIsoDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toISOString().slice(0, 10)
}

const buildInvoiceStats = (summary: InvoiceSummary): InvoiceStatItem[] => {
  return [
    { name: "Factures importées", value: `${summary.count}` },
    { name: "TVA collectée", value: formatCurrencyValue(summary.sumTva) },
    { name: "Dépenses HT", value: formatCurrencyValue(summary.sumHt) },
  ]
}

const buildLatestVariations = (
  variations: VariationRow[],
  masterById: Map<string, MasterArticleRow>,
  supplierById: Map<string, SupplierRow>
): LatestVariation[] => {
  const latestByMaster = new Map<string, VariationRow>()
  variations.forEach((item) => {
    if (item.is_deleted) return
    const masterId = item.master_article_id
    if (!masterId) return
    const existing = latestByMaster.get(masterId)
    if (!existing) {
      latestByMaster.set(masterId, item)
      return
    }
    const existingDate = new Date(existing.date).getTime()
    const nextDate = new Date(item.date).getTime()
    if (nextDate > existingDate) {
      latestByMaster.set(masterId, item)
    }
  })

  return Array.from(latestByMaster.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
    .map((item) => {
      const masterId = item.master_article_id
      const master = masterById.get(masterId)
      const supplierId = master?.supplier_id
      const supplier = supplierId ? supplierById.get(supplierId) : undefined
      const articleName = master?.name || master?.unformatted_name || "Article"
      const supplierName = supplier?.name || "Fournisseur"
      return {
        id: item.id,
        masterArticleId: masterId,
        article: articleName,
        supplier: supplierName,
        date: item.date,
        unitPrice: toNumber(item.new_unit_price),
        changePercent: toNumber(item.percentage) ?? 0,
      }
    })
}

const buildOptimizedProducts = (
  ingredients: FinancialIngredientRow[],
  masterById: Map<string, MasterArticleRow>,
  supplierById: Map<string, SupplierRow>
) => {
  const grouped = new Map<
    string,
    {
      quantity: number
      savings: number
      gapValueWeighted: number
      gapPercentWeighted: number
    }
  >()

  ingredients.forEach((item) => {
    const masterId = item.master_article_id
    if (!masterId) return

    const quantity = toNumber(item.quantity) ?? 0
    const gapValue = toNumber(item.market_gap_value) ?? 0
    const gapPercent = toNumber(item.market_gap_percentage) ?? 0
    const savings = toNumber(item.market_total_savings) ?? 0

    const entry = grouped.get(masterId) ?? {
      quantity: 0,
      savings: 0,
      gapValueWeighted: 0,
      gapPercentWeighted: 0,
    }

    entry.quantity += quantity
    entry.savings += savings
    entry.gapValueWeighted += gapValue * quantity
    entry.gapPercentWeighted += gapPercent * quantity

    grouped.set(masterId, entry)
  })

  const products: OptimizedProduct[] = []
  let totalMonthlySavings = 0

  grouped.forEach((entry, masterId) => {
    const master = masterById.get(masterId)
    const supplierId = master?.supplier_id
    const supplier = supplierId ? supplierById.get(supplierId) : undefined
    const quantity = entry.quantity
    const avgGapValue = quantity ? entry.gapValueWeighted / quantity : 0
    const avgGapPercent = quantity ? entry.gapPercentWeighted / quantity : 0

    const unitMarket = avgGapPercent ? avgGapValue / avgGapPercent : null
    const unitPaid = unitMarket !== null ? unitMarket + avgGapValue : null

    const product: OptimizedProduct = {
      id: masterId,
      name: master?.name || master?.unformatted_name || "Article",
      supplier: supplier?.name || "Fournisseur",
      unitPaid,
      unitMarket,
      monthlyQty: quantity,
      unit: master?.unit || "u",
      monthlySavings: entry.savings,
    }

    if (avgGapValue > 0) {
      totalMonthlySavings += entry.savings
      products.push(product)
    }
  })

  products.sort((a, b) => b.monthlySavings - a.monthlySavings)

  return {
    products: products.slice(0, 8),
    totalMonthlySavings,
  }
}

const buildMarginSeries = (rows: RecipeMarginRow[]): MarginSeriesPoint[] => {
  const series = rows
    .filter((row) => row.average_margin !== null && row.average_margin !== undefined)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((row) => ({
      date: formatIsoDate(row.date),
      value: normalizePercent(toNumber(row.average_margin)) ?? 0,
    }))

  return series.slice(-5)
}

const buildTopLowMargin = (recipes: RecipeRow[]): RecipeMarginItem[] => {
  return recipes
    .filter(
      (recipe) =>
        recipe.active &&
        recipe.saleable &&
        recipe.current_margin !== null &&
        recipe.current_margin !== undefined
    )
    .sort((a, b) => (toNumber(a.current_margin) ?? 0) - (toNumber(b.current_margin) ?? 0))
    .slice(0, 5)
    .map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      marginValue: normalizePercent(toNumber(recipe.current_margin)),
      active: recipe.active,
      saleable: recipe.saleable,
    }))
}

const fetchInvoiceSummary = async (
  establishmentId: string,
  reportMonth?: string
): Promise<InvoiceSummary> => {
  const monthBounds = getMonthBounds(reportMonth)
  const { data } = await api.get("/invoices/sum", {
    params: {
      establishment_id: establishmentId,
      start_date: monthBounds?.start,
      end_date: monthBounds?.end,
    },
  })

  const totals = data?.totals ?? {}
  return {
    count: toNumber(data?.count) ?? 0,
    sumHt: toNumber(totals.sum_ht) ?? 0,
    sumTva: toNumber(totals.sum_tva) ?? 0,
    sumTtc: toNumber(totals.sum_ttc) ?? 0,
  }
}

const fetchVariations = async (establishmentId: string): Promise<VariationRow[]> => {
  const { data } = await api.get("/variations/", {
    params: {
      establishment_id: establishmentId,
      order_by: "date",
      direction: "desc",
      limit: 20,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchFinancialReport = async (establishmentId: string): Promise<FinancialReportRow | null> => {
  const { data } = await api.get("/financial_reports/", {
    params: {
      establishment_id: establishmentId,
      order_by: "month",
      direction: "desc",
      limit: 1,
    },
  })
  if (!Array.isArray(data) || data.length === 0) return null
  return data[0]
}

const fetchFinancialIngredients = async (
  establishmentId: string,
  reportId?: string
): Promise<FinancialIngredientRow[]> => {
  const { data } = await api.get("/financial_ingredients/", {
    params: {
      establishment_id: establishmentId,
      financial_report_id: reportId,
      order_by: "market_total_savings",
      direction: "desc",
      limit: 2000,
    },
  })
  const items = Array.isArray(data) ? data : []
  if (!reportId) return items
  return items.filter((item) => item.financial_report_id === reportId)
}

const fetchMasterArticles = async (establishmentId: string): Promise<MasterArticleRow[]> => {
  const { data } = await api.get("/master_articles/", {
    params: {
      establishment_id: establishmentId,
      order_by: "unformatted_name",
      direction: "asc",
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchSuppliers = async (establishmentId: string): Promise<SupplierRow[]> => {
  const { data } = await api.get("/suppliers/", {
    params: {
      establishment_id: establishmentId,
      order_by: "name",
      direction: "asc",
      limit: 1000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchRecipes = async (establishmentId: string): Promise<RecipeRow[]> => {
  const { data } = await api.get("/recipes/", {
    params: {
      establishment_id: establishmentId,
      order_by: "name",
      direction: "asc",
      limit: 2000,
    },
  })
  return Array.isArray(data) ? data : []
}

const fetchRecipeMargins = async (establishmentId: string): Promise<RecipeMarginRow[]> => {
  const { data } = await api.get("/recipe_margin/", {
    params: {
      establishment_id: establishmentId,
      order_by: "date",
      direction: "desc",
      limit: 10,
    },
  })
  return Array.isArray(data) ? data : []
}

export function useDashboardHomeData() {
  const { estId } = useEstablishment()
  const [data, setData] = useState<HomeDashboardData>(EMPTY_DATA)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!estId) {
      setData(EMPTY_DATA)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const errors: string[] = []
      const safe = async <T>(label: string, fn: () => Promise<T>, fallback: T) => {
        try {
          return await fn()
        } catch {
          errors.push(label)
          return fallback
        }
      }

      const report = await safe("financial_report", () => fetchFinancialReport(estId), null)

      const [
        variations,
        masterArticles,
        suppliers,
        recipes,
        recipeMargins,
        invoiceSummary,
      ] = await Promise.all([
        safe("variations", () => fetchVariations(estId), [] as VariationRow[]),
        safe("master_articles", () => fetchMasterArticles(estId), [] as MasterArticleRow[]),
        safe("suppliers", () => fetchSuppliers(estId), [] as SupplierRow[]),
        safe("recipes", () => fetchRecipes(estId), [] as RecipeRow[]),
        safe("recipe_margin", () => fetchRecipeMargins(estId), [] as RecipeMarginRow[]),
        safe("invoices_sum", () => fetchInvoiceSummary(estId, report?.month), {
          count: 0,
          sumHt: 0,
          sumTva: 0,
          sumTtc: 0,
        } as InvoiceSummary),
      ])

      const financialIngredients = report
        ? await safe(
            "financial_ingredients",
            () => fetchFinancialIngredients(estId, report.id),
            [] as FinancialIngredientRow[]
          )
        : []

      const masterById = new Map(masterArticles.map((item) => [item.id, item]))
      const supplierById = new Map(suppliers.map((item) => [item.id, item]))

      const { products: optimizedProducts, totalMonthlySavings } = buildOptimizedProducts(
        financialIngredients,
        masterById,
        supplierById
      )

      const latestVariations = buildLatestVariations(variations, masterById, supplierById)
      const marginSeries = buildMarginSeries(recipeMargins)
      const topLowMargin = buildTopLowMargin(recipes)
      const invoiceStats = buildInvoiceStats(invoiceSummary)

      setData({
        invoiceStats,
        latestVariations,
        optimizedProducts,
        totalMonthlySavings,
        marginSeries,
        topLowMargin,
        reportMonth: report?.month,
      })
      if (errors.length) {
        setError(`Certaines données n'ont pas pu être chargées (${errors.join(", ")}).`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur de chargement"
      setError(message)
      setData(EMPTY_DATA)
    } finally {
      setIsLoading(false)
    }
  }, [estId])

  useEffect(() => {
    reload()
  }, [reload])

  const currentMonthLabel = useMemo(() => formatMonthLabel(data.reportMonth), [data.reportMonth])

  const dismissVariation = useCallback(
    async (masterArticleId: string) => {
      if (!masterArticleId || !estId) return 0
      const { data } = await api.get<VariationRow[]>("/variations", {
        params: {
          establishment_id: estId,
          limit: 2000,
        },
      })
      const ids =
        Array.isArray(data)
          ? data
              .filter((row) => row.master_article_id === masterArticleId)
              .map((row) => row.id)
          : []
      if (!ids.length) return 0
      await Promise.all(ids.map((id) => api.patch(`/variations/${id}`, { is_deleted: true })))
      await reload()
      return ids.length
    },
    [estId, reload]
  )

  const dismissAllVariations = useCallback(async () => {
    if (!estId) return 0
    const { data } = await api.get<VariationRow[]>("/variations", {
      params: {
        establishment_id: estId,
        limit: 2000,
      },
    })
    const ids = Array.isArray(data) ? data.map((row) => row.id) : []
    if (!ids.length) return 0
    await Promise.all(ids.map((id) => api.patch(`/variations/${id}`, { is_deleted: true })))
    await reload()
    return ids.length
  }, [estId, reload])

  return {
    data,
    isLoading,
    error,
    reload,
    currentMonthLabel,
    dismissVariation,
    dismissAllVariations,
  }
}

export const formatters = {
  formatPercentValue,
  formatCurrencyValue,
  formatMonthLabel,
}
