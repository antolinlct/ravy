import { useEffect, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import type { AreaChartPoint } from "@/components/blocks/area-chart"
import api from "@/lib/axiosClient"
import type {
  AlternativeItem,
  FinancialIngredientInfo,
  InvoiceRow,
  InvoiceSummary,
  MarketComparison,
  MasterArticleInfo,
  RecipeImpactRow,
  SupplierInfo,
  SupplierLabel,
  SupplierOption,
  VariationEntry,
} from "./types"

type ApiSupplier = {
  id: string
  name?: string | null
  label?: string | null
  label_id?: string | null
}

type ApiMasterArticle = {
  id: string
  name?: string | null
  unformatted_name?: string | null
  supplier_id?: string | null
  unit?: string | null
  market_master_article_id?: string | null
}

type ApiFinancialReport = {
  id: string
  month?: string | null
}

type ApiFinancialIngredient = {
  id: string
  master_article_id?: string | null
  quantity?: number | null
  consumed_value?: number | null
  market_gap_value?: number | null
  market_gap_percentage?: number | null
  market_total_savings?: number | null
  market_balanced?: number | null
}

type ApiInvoiceRow = {
  id: string
  supplier_id?: string | null
  invoice_number?: string | number | null
  date?: string | null
  total_ht?: number | null
  total_tva?: number | null
  total_ttc?: number | null
  total_excl_tax?: number | null
  total_tax?: number | null
  total_incl_tax?: number | null
}

type ApiInvoiceSumResponse = {
  invoices?: ApiInvoiceRow[]
  totals?: {
    sum_ht?: number | null
    sum_tva?: number | null
    sum_ttc?: number | null
  }
}

type ApiVariation = {
  id: string
  master_article_id?: string | null
  percentage?: number | null
  date?: string | null
}

type ApiMasterArticleAnalysis = {
  master_article?: {
    id: string
    name_raw?: string | null
    name?: string | null
    unformatted_name?: string | null
    supplier_id?: string | null
    market_master_article_id?: string | null
  }
  stats?: {
    count_articles?: number
    avg_unit_price?: number
    min_unit_price?: number | null
    max_unit_price?: number | null
    total_quantity?: number
    avg_quantity?: number
    total_spent?: number
    price_first?: number | null
    price_last?: number | null
  }
  articles?: Array<{
    id: string
    date?: string | null
    unit_price?: number | null
    quantity?: number | null
    invoice_id?: string | null
    master_article_id?: string | null
  }>
  invoices?: Array<{
    id: string
    supplier_id?: string | null
    invoice_number?: string | number | null
    date?: string | null
    total_ht?: number | null
    total_ttc?: number | null
    total_excl_tax?: number | null
    total_tax?: number | null
    total_incl_tax?: number | null
  }>
}

type ApiMarketComparison = {
  stats_user?: {
    avg_price?: number | null
    total_qty?: number | null
  }
  stats_market?: {
    avg_price?: number | null
    min_price?: number | null
    max_price?: number | null
  }
  comparison?: {
    diff_avg_price?: number | null
    potential_savings?: number | null
  }
  market_master_article?: {
    unit?: string | null
  }
}

type ApiRecipesAnalysis = {
  recipes?: Array<{
    recipe_id: string
    recipe_name?: string | null
    purchase_cost_per_portion?: number | null
    selling_price_ht?: number | null
    cost_per_portion?: number | null
    variation_cost_per_portion_euro?: number | null
    variation_cost_per_portion_percent?: number | null
  }>
}

type ApiAlternatives = {
  alternatives?: Array<{
    similarity_score?: number
    master_article?: {
      id: string
      name_raw?: string | null
      name?: string | null
      unformatted_name?: string | null
    }
    latest_article?: {
      unit_price?: number | null
    }
    supplier?: {
      name?: string | null
    }
  }>
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toISODate = (value?: Date) => {
  if (!value || Number.isNaN(value.getTime())) return undefined
  return value.toISOString().slice(0, 10)
}

const sumInvoiceRows = (rows: ApiInvoiceRow[]) => {
  const sum = (values: Array<number | null | undefined>) =>
    values.reduce((acc, value) => acc + (toNumber(value) ?? 0), 0)
  return {
    sum_ht: sum(rows.map((row) => row.total_ht ?? row.total_excl_tax)),
    sum_tva: sum(rows.map((row) => row.total_tva ?? row.total_tax)),
    sum_ttc: sum(rows.map((row) => row.total_ttc ?? row.total_incl_tax)),
  }
}

const mapInvoiceSummary = (row: ApiInvoiceRow): InvoiceSummary => ({
  id: row.id,
  supplierId: row.supplier_id ?? null,
  date: row.date ?? null,
  totalHt: toNumber(row.total_ht ?? row.total_excl_tax) ?? 0,
  totalTtc: toNumber(row.total_ttc ?? row.total_incl_tax) ?? 0,
})

const fetchInvoiceSummaries = async ({
  estId,
  startDate,
  endDate,
  supplierIds,
}: {
  estId: string
  startDate?: Date
  endDate?: Date
  supplierIds?: string[]
}): Promise<{ invoices: ApiInvoiceRow[]; totals: { sum_ht: number; sum_tva: number; sum_ttc: number } }> => {
  const sumParams: Record<string, unknown> = {
    establishment_id: estId,
    start_date: toISODate(startDate),
    end_date: toISODate(endDate),
  }
  if (supplierIds && supplierIds.length > 0) {
    sumParams.supplier_ids = supplierIds
  }
  try {
    const res = await api.get<ApiInvoiceSumResponse>("/invoices/sum", { params: sumParams })
    const invoices = res.data?.invoices ?? []
    const totals = res.data?.totals ?? sumInvoiceRows(invoices)
    const hasValues =
      invoices.length > 0 &&
      invoices.some(
        (inv) =>
          inv.total_ht !== null ||
          inv.total_excl_tax !== null ||
          inv.total_ttc !== null ||
          inv.total_incl_tax !== null
      )
    if (hasValues) {
      return {
        invoices,
        totals: {
          sum_ht: toNumber(totals.sum_ht) ?? 0,
          sum_tva: toNumber(totals.sum_tva) ?? 0,
          sum_ttc: toNumber(totals.sum_ttc) ?? 0,
        },
      }
    }
  } catch {
    // fallback handled below
  }
  try {
    const listParams: Record<string, unknown> = {
      establishment_id: estId,
      order_by: "date",
      direction: "desc",
      limit: 2000,
    }
    const start = toISODate(startDate)
    const end = toISODate(endDate)
    if (start) listParams.date_gte = start
    if (end) listParams.date_lte = end
    if (supplierIds && supplierIds.length === 1) {
      listParams.supplier_id = supplierIds[0]
    }
    const listRes = await api.get<ApiInvoiceRow[]>("/invoices", { params: listParams })
    let invoices = listRes.data ?? []
    if (supplierIds && supplierIds.length > 1) {
      const allowed = new Set(supplierIds)
      invoices = invoices.filter((row) => row.supplier_id && allowed.has(row.supplier_id))
    }
    const totals = sumInvoiceRows(invoices)
    return {
      invoices,
      totals: {
        sum_ht: toNumber(totals.sum_ht) ?? 0,
        sum_tva: toNumber(totals.sum_tva) ?? 0,
        sum_ttc: toNumber(totals.sum_ttc) ?? 0,
      },
    }
  } catch {
    return { invoices: [], totals: { sum_ht: 0, sum_tva: 0, sum_ttc: 0 } }
  }
}

const fetchLatestFinancialIngredients = async (estId: string) => {
  const reportRes = await api.get<ApiFinancialReport[]>("/financial_reports", {
    params: {
      establishment_id: estId,
      order_by: "month",
      direction: "desc",
      limit: 1,
    },
  })
  const report = reportRes.data?.[0]
  if (!report?.id) {
    return [] as ApiFinancialIngredient[]
  }
  const ingredientsRes = await api.get<ApiFinancialIngredient[]>("/financial_ingredients", {
    params: {
      financial_report_id: report.id,
      order_by: "consumed_value",
      direction: "desc",
      limit: 4000,
    },
  })
  return ingredientsRes.data ?? []
}

const normalizeSupplierLabel = (value?: string | null): SupplierLabel | null => {
  if (!value) return null
  const normalized = value.trim().toUpperCase().replace(/_/g, " ")
  const allowed: SupplierLabel[] = ["FOOD", "BEVERAGES", "FIXED COSTS", "VARIABLE COSTS", "OTHER"]
  return allowed.includes(normalized as SupplierLabel) ? (normalized as SupplierLabel) : null
}

const resolveSupplierLabel = (supplier: ApiSupplier): SupplierLabel | null =>
  normalizeSupplierLabel(supplier.label ?? supplier.label_id)

const resolveMasterArticleName = (article: ApiMasterArticle) =>
  article.name ?? article.unformatted_name ?? "Article"

const resolveAnalysisArticleName = (article?: ApiMasterArticleAnalysis["master_article"]) =>
  article?.unformatted_name ?? article?.name ?? article?.name_raw ?? "Article"

export const supplierLabelDisplay: Record<SupplierLabel, string> = {
  FOOD: "Alimentaire",
  BEVERAGES: "Boissons",
  "FIXED COSTS": "Charges fixes",
  "VARIABLE COSTS": "Charges variables",
  OTHER: "Autres",
}

export const useSuppliersList = (estId?: string | null) => {
  const query = useQuery({
    queryKey: ["analytics-products", "suppliers", estId],
    enabled: Boolean(estId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get<ApiSupplier[]>("/suppliers", {
        params: {
          establishment_id: estId,
          order_by: "name",
          direction: "asc",
          limit: 2000,
        },
      })
      const list = res.data ?? []
      return list.map((supplier) => ({
        id: supplier.id,
        name: supplier.name ?? "Fournisseur",
        label: resolveSupplierLabel(supplier),
      }))
    },
  })

  return { suppliers: query.data ?? [], isLoading: query.isLoading }
}

export const useMasterArticlesList = (estId?: string | null, supplierId?: string | null) => {
  const query = useQuery({
    queryKey: ["analytics-products", "master-articles", estId, supplierId],
    enabled: Boolean(estId && supplierId),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get<ApiMasterArticle[]>("/master_articles", {
        params: {
          establishment_id: estId,
          supplier_id: supplierId,
          order_by: "unformatted_name",
          direction: "asc",
          limit: 2000,
        },
      })
      const list = res.data ?? []
      return list.map((article) => ({
        id: article.id,
        name: resolveMasterArticleName(article),
        supplierId: article.supplier_id ?? null,
        unit: article.unit ?? null,
        marketMasterArticleId: article.market_master_article_id ?? null,
      }))
    },
  })

  return { masterArticles: query.data ?? [], isLoading: query.isLoading }
}

export const useProductOverviewData = (
  estId?: string | null,
  startDate?: Date,
  endDate?: Date
) => {
  const startKey = toISODate(startDate)
  const endKey = toISODate(endDate)
  const query = useQuery({
    queryKey: ["analytics-products", "overview", estId, startKey, endKey],
    enabled: Boolean(estId),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!estId) {
        return {
          suppliers: [] as SupplierInfo[],
          masterArticles: [] as MasterArticleInfo[],
          invoices: [] as InvoiceSummary[],
          financialIngredients: [] as FinancialIngredientInfo[],
          variations: [] as VariationEntry[],
        }
      }

      const [suppliersRes, masterRes, invoicesRes, variationsRes, financialRes] = await Promise.allSettled([
        api.get<ApiSupplier[]>("/suppliers", {
          params: {
            establishment_id: estId,
            order_by: "name",
            direction: "asc",
            limit: 2000,
          },
        }),
        api.get<ApiMasterArticle[]>("/master_articles", {
          params: {
            establishment_id: estId,
            order_by: "unformatted_name",
            direction: "asc",
            limit: 4000,
          },
        }),
        fetchInvoiceSummaries({ estId, startDate, endDate }),
        api.get<ApiVariation[]>("/variations", {
          params: {
            establishment_id: estId,
            order_by: "date",
            direction: "desc",
            limit: 200,
          },
        }),
        fetchLatestFinancialIngredients(estId),
      ])

      const suppliersList = suppliersRes.status === "fulfilled" ? suppliersRes.value.data ?? [] : []
      const masterList = masterRes.status === "fulfilled" ? masterRes.value.data ?? [] : []
      const invoicesList = invoicesRes.status === "fulfilled" ? invoicesRes.value.invoices ?? [] : []
      const variationsList = variationsRes.status === "fulfilled" ? variationsRes.value.data ?? [] : []
      const financialList = financialRes.status === "fulfilled" ? financialRes.value ?? [] : []

      return {
        suppliers: suppliersList.map((supplier) => ({
          id: supplier.id,
          name: supplier.name ?? "Fournisseur",
          label: resolveSupplierLabel(supplier),
        })),
        masterArticles: masterList.map((article) => ({
          id: article.id,
          name: resolveMasterArticleName(article),
          supplierId: article.supplier_id ?? null,
          unit: article.unit ?? null,
          marketMasterArticleId: article.market_master_article_id ?? null,
        })),
        invoices: invoicesList.map(mapInvoiceSummary),
        financialIngredients: financialList.map((ingredient) => ({
          id: ingredient.id,
          masterArticleId: ingredient.master_article_id ?? null,
          quantity: toNumber(ingredient.quantity) ?? 0,
          consumedValue: toNumber(ingredient.consumed_value) ?? 0,
          marketGapValue: toNumber(ingredient.market_gap_value) ?? 0,
          marketGapPercentage: toNumber(ingredient.market_gap_percentage) ?? 0,
          marketTotalSavings: toNumber(ingredient.market_total_savings) ?? 0,
          marketBalanced: toNumber(ingredient.market_balanced) ?? 0,
        })),
        variations: variationsList.map((variation) => ({
          id: variation.id,
          masterArticleId: variation.master_article_id ?? null,
          percentage: toNumber(variation.percentage),
          date: variation.date ?? null,
        })),
      }
    },
  })

  const data = query.data ?? {
    suppliers: [] as SupplierInfo[],
    masterArticles: [] as MasterArticleInfo[],
    invoices: [] as InvoiceSummary[],
    financialIngredients: [] as FinancialIngredientInfo[],
    variations: [] as VariationEntry[],
  }

  if (!estId) {
    return {
      ...data,
      isLoading: false,
      error: null,
      refresh: query.refetch,
    }
  }

  return {
    ...data,
    isLoading: query.isLoading,
    error: query.isError ? "Impossible de charger les analyses produits." : null,
    refresh: query.refetch,
  }
}

export const useMarketComparisons = (
  estId: string | null | undefined,
  masterArticleIds: string[],
  startDate?: Date,
  endDate?: Date
) => {
  const [comparisons, setComparisons] = useState<Record<string, MarketComparison>>({})

  useEffect(() => {
    if (!estId || masterArticleIds.length === 0) {
      setComparisons({})
      return
    }

    let active = true
    const uniqueIds = Array.from(new Set(masterArticleIds))

    const load = async () => {
      const entries = await Promise.allSettled(
        uniqueIds.map((id) =>
          api.get<ApiMarketComparison>(`/market/articles/${id}/comparison`, {
            params: {
              establishment_id: estId,
              start_date: toISODate(startDate),
              end_date: toISODate(endDate),
            },
          })
        )
      )

      if (!active) return
      const next: Record<string, MarketComparison> = {}
      entries.forEach((entry, idx) => {
        if (entry.status !== "fulfilled") return
        const data = entry.value.data ?? {}
        next[uniqueIds[idx]] = {
          statsUser: {
            avgPrice: toNumber(data.stats_user?.avg_price) ?? 0,
            totalQty: toNumber(data.stats_user?.total_qty) ?? 0,
          },
          statsMarket: {
            avgPrice: toNumber(data.stats_market?.avg_price) ?? 0,
            minPrice: toNumber(data.stats_market?.min_price),
            maxPrice: toNumber(data.stats_market?.max_price),
          },
          comparison: {
            diffAvgPrice: toNumber(data.comparison?.diff_avg_price),
            potentialSavings: toNumber(data.comparison?.potential_savings) ?? 0,
          },
          marketUnit: data.market_master_article?.unit ?? null,
        }
      })
      setComparisons(next)
    }

    load()
    return () => {
      active = false
    }
  }, [endDate, estId, masterArticleIds, startDate])

  return comparisons
}

const emptyDetailData = {
  analysis: null as ApiMasterArticleAnalysis | null,
  marketComparison: null as MarketComparison | null,
  recipes: [] as RecipeImpactRow[],
  alternatives: [] as AlternativeItem[],
  invoiceRows: [] as InvoiceRow[],
  costSeries: [] as AreaChartPoint[],
  lastPurchaseDate: null as Date | null,
  supplierShare: null as number | null,
  supplierMonthlySpend: null as number | null,
}

export const useMasterArticleDetailData = (
  estId: string | null | undefined,
  masterArticleId: string | null | undefined,
  startDate?: Date,
  endDate?: Date
) => {
  const startKey = toISODate(startDate)
  const endKey = toISODate(endDate)
  const query = useQuery({
    queryKey: ["analytics-products", "detail", estId, masterArticleId, startKey, endKey],
    enabled: Boolean(estId && masterArticleId),
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (!estId || !masterArticleId) return emptyDetailData

      const params = {
        establishment_id: estId,
        start_date: toISODate(startDate),
        end_date: toISODate(endDate),
      }
      const [analysisRes, marketRes, recipesRes, alternativesRes] = await Promise.allSettled([
        api.get<ApiMasterArticleAnalysis>(`/master-articles/${masterArticleId}/analysis`, { params }),
        api.get<ApiMarketComparison>(`/market/articles/${masterArticleId}/comparison`, { params }),
        api.get<ApiRecipesAnalysis>(`/master-articles/${masterArticleId}/recipes-analysis`, { params }),
        api.get<ApiAlternatives>(`/master-articles/${masterArticleId}/alternatives`, {
          params: { ...params, limit: 50, score_min: 50 },
        }),
      ])

      const analysisData = analysisRes.status === "fulfilled" ? analysisRes.value.data ?? null : null

      const marketData = marketRes.status === "fulfilled" ? marketRes.value.data ?? null : null
      const marketComparison = marketData
        ? {
            statsUser: {
              avgPrice: toNumber(marketData.stats_user?.avg_price) ?? 0,
              totalQty: toNumber(marketData.stats_user?.total_qty) ?? 0,
            },
            statsMarket: {
              avgPrice: toNumber(marketData.stats_market?.avg_price) ?? 0,
              minPrice: toNumber(marketData.stats_market?.min_price),
              maxPrice: toNumber(marketData.stats_market?.max_price),
            },
            comparison: {
              diffAvgPrice: toNumber(marketData.comparison?.diff_avg_price),
              potentialSavings: toNumber(marketData.comparison?.potential_savings) ?? 0,
            },
            marketUnit: marketData.market_master_article?.unit ?? null,
          }
        : null

      const recipesList = recipesRes.status === "fulfilled" ? recipesRes.value.data?.recipes ?? [] : []
      const recipes = recipesList.map((recipe) => {
        const costEnd = toNumber(recipe.cost_per_portion ?? recipe.purchase_cost_per_portion)
        const impactEuro = toNumber(recipe.variation_cost_per_portion_euro)
        const costStart = costEnd !== null && impactEuro !== null ? costEnd - impactEuro : costEnd
        const sellingPrice = toNumber(recipe.selling_price_ht) ?? 0
        return {
          id: recipe.recipe_id,
          name: recipe.recipe_name ?? "Recette",
          costStart,
          costEnd,
          impactEuro,
          isActive: true,
          isSold: sellingPrice > 0,
        }
      })

      const alternativesList =
        alternativesRes.status === "fulfilled"
          ? alternativesRes.value.data?.alternatives ?? []
          : []
      const alternatives = alternativesList.map((alt) => ({
        id: alt.master_article?.id ?? "",
        name: resolveAnalysisArticleName(alt.master_article),
        supplier: alt.supplier?.name ?? "Fournisseur",
        price: toNumber(alt.latest_article?.unit_price),
      }))

      const articles = analysisData?.articles ?? []
      const invoiceCountMap = new Map<string, number>()
      const series: AreaChartPoint[] = []
      let lastDate: Date | null = null
      articles.forEach((article) => {
        if (article.invoice_id) {
          invoiceCountMap.set(
            article.invoice_id,
            (invoiceCountMap.get(article.invoice_id) ?? 0) + 1
          )
        }
        if (article.date) {
          const date = new Date(article.date)
          if (!Number.isNaN(date.getTime())) {
            if (!lastDate || date > lastDate) lastDate = date
            const value = toNumber(article.unit_price)
            if (value !== null) {
              series.push({ date, value })
            }
          }
        }
      })
      if (!lastDate && startDate && endDate) {
        try {
          const articleRes = await api.get<Array<{ date?: string | null }>>("/articles/", {
            params: {
              establishment_id: estId,
              master_article_id: masterArticleId,
              date_gte: toISODate(startDate),
              date_lte: toISODate(endDate),
              order_by: "date",
              direction: "desc",
              limit: 1,
            },
          })
          const dateValue = articleRes.data?.[0]?.date
          if (dateValue) {
            const parsed = new Date(dateValue)
            if (!Number.isNaN(parsed.getTime())) {
              lastDate = parsed
            }
          }
        } catch {
          // ignore fallback errors
        }
      }
      const toTime = (point: AreaChartPoint) => {
        const date =
          point.date instanceof Date ? point.date : point.date ? new Date(point.date) : null
        return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
      }
      series.sort((a, b) => toTime(a) - toTime(b))

      const invoicesList = analysisData?.invoices ?? []
      if (invoicesList.length) {
        invoicesList.forEach((invoice) => {
          if (!invoice.date) return
          const date = new Date(invoice.date)
          if (Number.isNaN(date.getTime())) return
          if (!lastDate || date > lastDate) lastDate = date
        })
      }
      const invoiceRows = invoicesList.map((invoice) => {
        const rawInvoiceNumber = invoice.invoice_number
        const invoiceNumber =
          typeof rawInvoiceNumber === "string"
            ? rawInvoiceNumber.trim()
            : rawInvoiceNumber !== null && rawInvoiceNumber !== undefined
              ? String(rawInvoiceNumber)
              : ""
        const displayNumber = invoiceNumber ? `Facture N°${invoiceNumber}` : "Facture N°-"
        return {
          id: invoice.id,
          number: displayNumber,
          items: invoiceCountMap.get(invoice.id) ?? 0,
          date: invoice.date ?? "",
          ttc:
            toNumber(
              invoice.total_incl_tax ??
                invoice.total_ttc ??
                invoice.total_ht ??
                invoice.total_excl_tax
            ) ?? 0,
        }
      })

      let supplierShare: number | null = null
      let supplierMonthlySpend: number | null = null
      const masterSupplierId = analysisData?.master_article?.supplier_id ?? null
      if (masterSupplierId) {
        const [totalRes, supplierRes] = await Promise.all([
          fetchInvoiceSummaries({ estId, startDate, endDate }),
          fetchInvoiceSummaries({ estId, startDate, endDate, supplierIds: [masterSupplierId] }),
        ])
        const total = totalRes.totals.sum_ht
        const supplierTotal = supplierRes.totals.sum_ht
        supplierMonthlySpend = supplierTotal || null
        supplierShare = total > 0 ? supplierTotal / total : null
      }

      return {
        analysis: analysisData,
        marketComparison,
        recipes,
        alternatives,
        invoiceRows,
        costSeries: series,
        lastPurchaseDate: lastDate,
        supplierShare,
        supplierMonthlySpend,
      }
    },
  })

  if (!estId || !masterArticleId) {
    return {
      ...emptyDetailData,
      isLoading: false,
    }
  }

  return {
    ...(query.data ?? emptyDetailData),
    isLoading: query.isLoading,
  }
}

export const buildSupplierOptions = (suppliers: SupplierInfo[]): SupplierOption[] =>
  suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name }))

export const buildSupplierSeries = (
  invoices: InvoiceSummary[],
  interval: "day" | "week" | "month"
): AreaChartPoint[] => {
  const buckets = new Map<string, { date: Date; value: number }>()

  const toBucketKey = (date: Date) => {
    if (interval === "month") {
      return `${date.getFullYear()}-${date.getMonth()}`
    }
    if (interval === "week") {
      const firstDay = new Date(date)
      const day = firstDay.getDay()
      const diff = firstDay.getDate() - day + (day === 0 ? -6 : 1)
      firstDay.setDate(diff)
      firstDay.setHours(0, 0, 0, 0)
      return firstDay.toISOString().slice(0, 10)
    }
    return date.toISOString().slice(0, 10)
  }

  invoices.forEach((invoice) => {
    if (!invoice.date) return
    const date = new Date(invoice.date)
    if (Number.isNaN(date.getTime())) return
    const key = toBucketKey(date)
    const existing = buckets.get(key)
    if (existing) {
      existing.value += invoice.totalHt
    } else {
      const bucketDate =
        interval === "month"
          ? new Date(date.getFullYear(), date.getMonth(), 1)
          : interval === "week"
            ? new Date(key)
            : new Date(date.getFullYear(), date.getMonth(), date.getDate())
      buckets.set(key, { date: bucketDate, value: invoice.totalHt })
    }
  })

  return Array.from(buckets.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

export const formatVariationLabel = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "0%"
  const sign = value > 0 ? "+" : value < 0 ? "-" : ""
  const formatted = Math.abs(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  return `${sign}${formatted}%`
}
