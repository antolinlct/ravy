import { useCallback, useEffect, useState } from "react"
import type { AreaChartPoint } from "@/components/blocks/area-chart"
import api from "@/lib/axiosClient"
import type {
  AlternativeItem,
  InvoiceRow,
  InvoiceSummary,
  MarketComparison,
  MasterArticleInfo,
  ProductAggregate,
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

type ApiInvoiceSumResponse = {
  invoices?: Array<{
    id: string
    supplier_id?: string | null
    date?: string | null
    total_ht?: number | null
    total_ttc?: number | null
    total_excl_tax?: number | null
    total_incl_tax?: number | null
  }>
  totals?: {
    sum_ht?: number | null
    sum_ttc?: number | null
  }
}

type ApiInvoiceDetailResponse = {
  articles?: Array<{
    master_article_id?: string | null
    unit_price?: number | null
    quantity?: number | null
    unit?: string | null
  }>
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
    date?: string | null
    total_ht?: number | null
    total_ttc?: number | null
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

const resolveSupplierLabel = (supplier: ApiSupplier): SupplierLabel | null => {
  const label = supplier.label ?? supplier.label_id
  return (label as SupplierLabel) ?? null
}

const resolveMasterArticleName = (article: ApiMasterArticle) =>
  article.name ?? article.unformatted_name ?? "Article"

const resolveAnalysisArticleName = (article?: ApiMasterArticleAnalysis["master_article"]) =>
  article?.name_raw ?? article?.name ?? article?.unformatted_name ?? "Article"

export const supplierLabelDisplay: Record<SupplierLabel, string> = {
  FOOD: "Alimentaire",
  BEVERAGES: "Boissons",
  "FIXED COSTS": "Charges fixes",
  "VARIABLE COSTS": "Charges variables",
  OTHER: "Autres",
}

export const useSuppliersList = (estId?: string | null) => {
  const [suppliers, setSuppliers] = useState<SupplierInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!estId) return
    let active = true

    const load = async () => {
      setIsLoading(true)
      try {
        const res = await api.get<ApiSupplier[]>("/suppliers", {
          params: {
            establishment_id: estId,
            order_by: "name",
            direction: "asc",
            limit: 2000,
          },
        })
        if (!active) return
        const list = res.data ?? []
        setSuppliers(
          list.map((supplier) => ({
            id: supplier.id,
            name: supplier.name ?? "Fournisseur",
            label: resolveSupplierLabel(supplier),
          }))
        )
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [estId])

  return { suppliers, isLoading }
}

export const useMasterArticlesList = (estId?: string | null, supplierId?: string | null) => {
  const [masterArticles, setMasterArticles] = useState<MasterArticleInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!estId || !supplierId) {
      setMasterArticles([])
      return
    }
    let active = true

    const load = async () => {
      setIsLoading(true)
      try {
        const res = await api.get<ApiMasterArticle[]>("/master_articles", {
          params: {
            establishment_id: estId,
            supplier_id: supplierId,
            order_by: "unformatted_name",
            direction: "asc",
            limit: 2000,
          },
        })
        if (!active) return
        const list = res.data ?? []
        setMasterArticles(
          list.map((article) => ({
            id: article.id,
            name: resolveMasterArticleName(article),
            supplierId: article.supplier_id ?? null,
            unit: article.unit ?? null,
            marketMasterArticleId: article.market_master_article_id ?? null,
          }))
        )
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [estId, supplierId])

  return { masterArticles, isLoading }
}

export const useProductOverviewData = (
  estId?: string | null,
  startDate?: Date,
  endDate?: Date
) => {
  const [suppliers, setSuppliers] = useState<SupplierInfo[]>([])
  const [masterArticles, setMasterArticles] = useState<MasterArticleInfo[]>([])
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([])
  const [productAggregates, setProductAggregates] = useState<ProductAggregate[]>([])
  const [variations, setVariations] = useState<VariationEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!estId) return
    setIsLoading(true)
    setError(null)
    try {
      const [suppliersRes, masterRes, invoicesRes, variationsRes] = await Promise.all([
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
        api.get<ApiInvoiceSumResponse>("/invoices/sum", {
          params: {
            establishment_id: estId,
            start_date: toISODate(startDate),
            end_date: toISODate(endDate),
          },
        }),
        api.get<ApiVariation[]>("/variations", {
          params: {
            establishment_id: estId,
            order_by: "date",
            direction: "desc",
            limit: 200,
          },
        }),
      ])

      const suppliersList = suppliersRes.data ?? []
      const masterList = masterRes.data ?? []
      const invoicesList = invoicesRes.data?.invoices ?? []
      const variationsList = variationsRes.data ?? []

      setSuppliers(
        suppliersList.map((supplier) => ({
          id: supplier.id,
          name: supplier.name ?? "Fournisseur",
          label: resolveSupplierLabel(supplier),
        }))
      )
      setMasterArticles(
        masterList.map((article) => ({
          id: article.id,
          name: resolveMasterArticleName(article),
          supplierId: article.supplier_id ?? null,
          unit: article.unit ?? null,
          marketMasterArticleId: article.market_master_article_id ?? null,
        }))
      )

      const mappedInvoices: InvoiceSummary[] = invoicesList.map((inv) => ({
        id: inv.id,
        supplierId: inv.supplier_id ?? null,
        date: inv.date ?? null,
        totalHt: toNumber(inv.total_ht ?? inv.total_excl_tax) ?? 0,
        totalTtc: toNumber(inv.total_ttc ?? inv.total_incl_tax) ?? 0,
      }))
      setInvoices(mappedInvoices)

      const aggregateMap = new Map<string, ProductAggregate>()
      const invoiceMeta = new Map<string, { supplierId: string | null; date: string | null }>()
      mappedInvoices.forEach((inv) => {
        invoiceMeta.set(inv.id, { supplierId: inv.supplierId, date: inv.date })
      })

      const details = await Promise.allSettled(
        mappedInvoices.map((invoice) => api.get<ApiInvoiceDetailResponse>(`/invoices/${invoice.id}/details`))
      )
      details.forEach((result, index) => {
        if (result.status !== "fulfilled") return
        const invoice = mappedInvoices[index]
        const meta = invoiceMeta.get(invoice.id)
        const articles = result.value.data?.articles ?? []
        articles.forEach((article) => {
          const masterArticleId = article.master_article_id
          if (!masterArticleId) return
          const qty = toNumber(article.quantity) ?? 0
          const unitPrice = toNumber(article.unit_price) ?? 0
          const totalSpend = qty && unitPrice ? qty * unitPrice : 0
          const current = aggregateMap.get(masterArticleId) ?? {
            masterArticleId,
            supplierId: meta?.supplierId ?? null,
            totalSpend: 0,
            totalQty: 0,
            avgUnitPrice: 0,
            unit: article.unit ?? null,
            lastInvoiceDate: meta?.date ?? null,
          }
          current.totalSpend += totalSpend
          current.totalQty += qty
          current.unit = current.unit ?? article.unit ?? null
          if (meta?.date) {
            current.lastInvoiceDate = current.lastInvoiceDate
              ? meta.date > current.lastInvoiceDate
                ? meta.date
                : current.lastInvoiceDate
              : meta.date
          }
          aggregateMap.set(masterArticleId, current)
        })
      })

      const aggregates = Array.from(aggregateMap.values()).map((entry) => ({
        ...entry,
        avgUnitPrice: entry.totalQty > 0 ? entry.totalSpend / entry.totalQty : 0,
      }))
      setProductAggregates(aggregates)

      setVariations(
        variationsList.map((variation) => ({
          id: variation.id,
          masterArticleId: variation.master_article_id ?? null,
          percentage: toNumber(variation.percentage),
          date: variation.date ?? null,
        }))
      )
    } catch (err) {
      setError("Impossible de charger les analyses produits.")
      setSuppliers([])
      setMasterArticles([])
      setInvoices([])
      setProductAggregates([])
      setVariations([])
    } finally {
      setIsLoading(false)
    }
  }, [endDate, estId, startDate])

  useEffect(() => {
    load()
  }, [load])

  return {
    suppliers,
    masterArticles,
    invoices,
    productAggregates,
    variations,
    isLoading,
    error,
    refresh: load,
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

export const useMasterArticleDetailData = (
  estId: string | null | undefined,
  masterArticleId: string | null | undefined,
  startDate?: Date,
  endDate?: Date
) => {
  const [analysis, setAnalysis] = useState<ApiMasterArticleAnalysis | null>(null)
  const [marketComparison, setMarketComparison] = useState<MarketComparison | null>(null)
  const [recipes, setRecipes] = useState<RecipeImpactRow[]>([])
  const [alternatives, setAlternatives] = useState<AlternativeItem[]>([])
  const [invoiceRows, setInvoiceRows] = useState<InvoiceRow[]>([])
  const [costSeries, setCostSeries] = useState<AreaChartPoint[]>([])
  const [lastPurchaseDate, setLastPurchaseDate] = useState<Date | null>(null)
  const [supplierShare, setSupplierShare] = useState<number | null>(null)
  const [supplierMonthlySpend, setSupplierMonthlySpend] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!estId || !masterArticleId) {
      setAnalysis(null)
      setMarketComparison(null)
      setRecipes([])
      setAlternatives([])
      setInvoiceRows([])
      setCostSeries([])
      setLastPurchaseDate(null)
      setSupplierShare(null)
      setSupplierMonthlySpend(null)
      return
    }

    let active = true
    const load = async () => {
      setIsLoading(true)
      try {
        const params = {
          establishment_id: estId,
          start_date: toISODate(startDate),
          end_date: toISODate(endDate),
        }
        const [analysisRes, marketRes, recipesRes, alternativesRes] = await Promise.all([
          api.get<ApiMasterArticleAnalysis>(`/master-articles/${masterArticleId}/analysis`, { params }),
          api.get<ApiMarketComparison>(`/market/articles/${masterArticleId}/comparison`, { params }),
          api.get<ApiRecipesAnalysis>(`/master-articles/${masterArticleId}/recipes-analysis`, { params }),
          api.get<ApiAlternatives>(`/master-articles/${masterArticleId}/alternatives`, {
            params: { ...params, limit: 50, score_min: 50 },
          }),
        ])

        if (!active) return

        const analysisData = analysisRes.data ?? null
        setAnalysis(analysisData)

        const marketData = marketRes.data ?? null
        setMarketComparison(
          marketData
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
        )

        const recipesList = recipesRes.data?.recipes ?? []
        setRecipes(
          recipesList.map((recipe) => {
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
        )

        const alternativesList = alternativesRes.data?.alternatives ?? []
        setAlternatives(
          alternativesList.map((alt) => ({
            id: alt.master_article?.id ?? "",
            name: resolveAnalysisArticleName(alt.master_article),
            supplier: alt.supplier?.name ?? "Fournisseur",
            price: toNumber(alt.latest_article?.unit_price),
          }))
        )

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
        const toTime = (point: AreaChartPoint) => {
          const date =
            point.date instanceof Date
              ? point.date
              : point.date
                ? new Date(point.date)
                : null
          return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
        }
        series.sort((a, b) => toTime(a) - toTime(b))
        setCostSeries(series)
        setLastPurchaseDate(lastDate)

        const invoicesList = analysisData?.invoices ?? []
        setInvoiceRows(
          invoicesList.map((invoice) => ({
            id: invoice.id,
            number: invoice.id ? `Facture ${invoice.id.slice(0, 6)}` : "Facture",
            items: invoiceCountMap.get(invoice.id) ?? 0,
            date: invoice.date ?? "",
            ttc: toNumber(invoice.total_ttc ?? invoice.total_ht) ?? 0,
          }))
        )

        const masterSupplierId = analysisData?.master_article?.supplier_id ?? null
        if (masterSupplierId) {
          const [totalRes, supplierRes] = await Promise.all([
            api.get<ApiInvoiceSumResponse>("/invoices/sum", { params }),
            api.get<ApiInvoiceSumResponse>("/invoices/sum", {
              params: {
                ...params,
                supplier_ids: [masterSupplierId],
              },
            }),
          ])
          const total = toNumber(totalRes.data?.totals?.sum_ht) ?? 0
          const supplierTotal = toNumber(supplierRes.data?.totals?.sum_ht) ?? 0
          setSupplierMonthlySpend(supplierTotal || null)
          setSupplierShare(total > 0 ? supplierTotal / total : null)
        } else {
          setSupplierMonthlySpend(null)
          setSupplierShare(null)
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [endDate, estId, masterArticleId, startDate])

  return {
    analysis,
    marketComparison,
    recipes,
    alternatives,
    invoiceRows,
    costSeries,
    lastPurchaseDate,
    supplierShare,
    supplierMonthlySpend,
    isLoading,
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
