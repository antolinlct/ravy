import { useCallback, useEffect, useState } from "react"
import api from "@/lib/axiosClient"
import type {
  InvoiceDetail,
  InvoiceItem,
  InvoiceListItem,
  InvoicePricePoint,
  LabelOption,
  MergeRequest,
  SupplierOption,
  SupplierRow,
} from "./types"

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "2-digit",
})

const longDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short",
  day: "2-digit",
  month: "long",
  year: "numeric",
})

const labelDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
})

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const quantityFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
})

type ApiInvoice = {
  id: string
  supplier_id?: string | null
  invoice_number?: string | null
  date?: string | null
  total_excl_tax?: number | null
  total_tax?: number | null
  total_incl_tax?: number | null
  total_ht?: number | null
  total_tva?: number | null
  total_ttc?: number | null
  created_at?: string | null
  updated_at?: string | null
  file_storage_path?: string | null
}

type ApiInvoiceDetailResponse = {
  invoice?: ApiInvoice
  articles?: ApiInvoiceDetailArticle[]
  articles_count?: number
}

type ApiInvoiceDetailArticle = {
  id: string
  name?: string | null
  quantity?: number | null
  unit?: string | null
  unit_price?: number | null
  total?: number | null
  duties_and_taxes?: number | null
  discounts?: number | null
  gross_unit_price?: number | null
  master_article_id?: string | null
  variation_percent?: number | null
  variation_euro?: number | null
}

type ApiSupplier = {
  id: string
  name?: string | null
  label?: string | null
  active_analyses?: boolean | null
  market_supplier_id?: string | null
}

type ApiMasterArticle = {
  id: string
  name?: string | null
  unformatted_name?: string | null
  unit?: string | null
}

type ApiVariation = {
  id: string
  master_article_id?: string | null
  new_unit_price?: number | null
  date?: string | null
}

type ApiSupplierMergeRequest = {
  id: string
  created_at?: string | null
  status?: string | null
  source_market_supplier_ids?: string[] | null
  target_market_supplier_id?: string | null
}

type ApiMarketSupplier = {
  id: string
  name?: string | null
}

export const supplierLabelOptions: LabelOption[] = [
  { value: "FOOD", label: "Alimentaire", tone: "default" },
  { value: "BEVERAGES", label: "Boissons", tone: "outline" },
  { value: "FIXED COSTS", label: "Charges fixes", tone: "secondary" },
  { value: "VARIABLE COSTS", label: "Charges variables", tone: "secondary" },
  { value: "OTHER", label: "Autres", tone: "outline" },
]

export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 3
export const ZOOM_STEP = 0.1
export const PINCH_SENSITIVITY = 350

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const normalizeInvoiceNumber = (value: string) => value.replace(/^N°\s*/, "").trim()
export const normalizeEuroValue = (value: string) => value.replace(/\s*€\s*/, "").trim()
export const formatInvoiceNumber = (value: string) => (value ? `N°${normalizeInvoiceNumber(value)}` : "")
export const formatEuroValue = (value: string) => {
  const clean = normalizeEuroValue(value)
  return clean ? `${clean} €` : ""
}

export const parseNumber = (value: string) => {
  const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".")
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : 0
}

export const formatEuroFromNumber = (value: number) =>
  Number.isFinite(value) ? currencyFormatter.format(value) : ""

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export const formatShortDate = (value?: string | Date | null) => {
  if (!value) return "--"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return shortDateFormatter.format(date)
}

export const formatLongDate = (value?: string | Date | null) => {
  if (!value) return "--"
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return "--"
  return longDateFormatter.format(date)
}

export const formatShortDateLabel = (value: Date) => {
  if (Number.isNaN(value.getTime())) return "--"
  return labelDateFormatter.format(value)
}

export const formatCurrencyValue = (value?: number | null) => {
  if (value === null || value === undefined) return "--"
  if (!Number.isFinite(value)) return "--"
  return currencyFormatter.format(value)
}

export const formatQuantityValue = (value?: number | null) => {
  if (value === null || value === undefined) return "--"
  if (!Number.isFinite(value)) return "--"
  return quantityFormatter.format(value)
}

export const formatSupplierLabel = (value?: string | null) => {
  if (!value) return "Autres"
  const match = supplierLabelOptions.find((option) => option.value === value)
  return match?.label ?? "Autres"
}

export const getSupplierLabelTone = (value?: string | null) => {
  const match = supplierLabelOptions.find((option) => option.value === value)
  return match?.tone ?? "outline"
}

const formatSupplierLabelStyle = (label: string) => {
  const base =
    "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors"
  const map: Record<string, string> = {
    Boissons: "bg-sky-500/10 text-sky-500 border-sky-500/30",
    Alimentaire: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    "Charges fixes": "bg-rose-500/10 text-rose-500 border-rose-500/30",
    "Charges variables": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    Autres: "bg-muted/40 text-foreground border-border",
    "Frais généraux": "bg-muted/40 text-foreground border-border",
  }
  return `${base} ${map[label] ?? map.Autres}`
}

export const supplierLabelStyle = (label: string) => formatSupplierLabelStyle(label)

export const filterInvoices = (
  invoices: InvoiceListItem[],
  from?: Date,
  to?: Date,
  suppliers?: string[]
) => {
  return invoices.filter((inv) => {
    const inSupplier = !suppliers?.length || suppliers.includes(inv.supplierValue)
    const inDate =
      (!from || (inv.dateValue && inv.dateValue >= from)) &&
      (!to || (inv.dateValue && inv.dateValue <= to))
    return inSupplier && inDate
  })
}

export const toCurrencyNumber = (value?: string) => {
  if (!value) return null
  const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".")
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : null
}

export const computeUnitPriceGross = (item: InvoiceItem) => {
  const base = parseNumber(item.unitPrice)
  const duties = item.dutiesTaxes ? parseNumber(item.dutiesTaxes) : 0
  const discount = item.discount ? parseNumber(item.discount) : 0
  const gross = base + duties - discount
  return Number.isFinite(gross) ? formatEuroFromNumber(gross) : "—"
}

export const formatCurrencyDisplay = (value?: string) => {
  if (!value) return "—"
  const num = parseNumber(value)
  if (Number.isFinite(num)) {
    return formatEuroFromNumber(num)
  }
  const normalized = normalizeEuroValue(value)
  return normalized ? formatEuroValue(normalized) : "—"
}

export const toCurrencyInputValue = (value?: string) => value?.replace(/[€%]/g, "").trim() ?? ""

export const useInvoiceAlias = (estId?: string | null) => {
  const [aliasEmail, setAliasEmail] = useState("")
  const [aliasActive, setAliasActive] = useState(false)

  useEffect(() => {
    if (!estId) return

    let active = true
    async function loadAlias() {
      try {
        const res = await api.get("/establishment_email_alias", {
          params: { establishment_id: estId },
        })
        if (!active) return
        const list = res.data
        const alias = Array.isArray(list) && list.length > 0 ? list[0] : null
        setAliasEmail(alias?.custom_email || "")
        setAliasActive(Boolean(alias?.enabled))
      } catch {
        /* ignore load errors */
      }
    }

    loadAlias()

    return () => {
      active = false
    }
  }, [estId])

  return { aliasEmail, aliasActive }
}

const getInvoiceTotals = (invoice: ApiInvoice) => {
  const ht = toNumber(invoice.total_excl_tax ?? invoice.total_ht)
  const tva = toNumber(invoice.total_tax ?? invoice.total_tva)
  const ttc = toNumber(invoice.total_incl_tax ?? invoice.total_ttc)
  return { ht, tva, ttc }
}

const formatInvoiceReference = (number?: string | null, fallbackId?: string) => {
  if (number) return number.startsWith("N°") ? number : `N° ${number}`
  return fallbackId ? `Facture ${fallbackId.slice(0, 6)}` : "--"
}

const formatDeltaPercent = (value?: number | null) => {
  if (value === null || value === undefined) return "0%"
  if (!Number.isFinite(value)) return "0%"
  const percent = value * 100
  const formatter = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const formatted = formatter.format(Math.abs(percent))
  return `${percent >= 0 ? "+" : "-"}${formatted}%`
}

export const useInvoicesListData = (estId?: string | null) => {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!estId) return
    setIsLoading(true)
    setError(null)
    try {
      const [suppliersRes, invoicesRes] = await Promise.all([
        api.get<ApiSupplier[]>("/suppliers", {
          params: {
            establishment_id: estId,
            order_by: "name",
            direction: "asc",
            limit: 1000,
          },
        }),
        api.get<ApiInvoice[]>("/invoices", {
          params: {
            establishment_id: estId,
            order_by: "date",
            direction: "desc",
            limit: 200,
          },
        }),
      ])

      const suppliers = suppliersRes.data ?? []
      const invoicesRaw = invoicesRes.data ?? []

      const supplierMap = new Map<string, ApiSupplier>()
      suppliers.forEach((supplier) => {
        if (supplier.id) supplierMap.set(supplier.id, supplier)
      })

      const countsByInvoice = new Map<string, number>()
      await Promise.allSettled(
        invoicesRaw.map(async (inv) => {
          if (!inv.id) return
          const detailRes = await api.get<ApiInvoiceDetailResponse>(`/invoices/${inv.id}/details`)
          const count = detailRes.data?.articles_count
          if (typeof count === "number") {
            countsByInvoice.set(inv.id, count)
          }
        })
      )

      const mappedInvoices: InvoiceListItem[] = invoicesRaw.map((inv) => {
        const supplier = inv.supplier_id ? supplierMap.get(inv.supplier_id) : undefined
        const totals = getInvoiceTotals(inv)
        const dateValue = inv.date ? new Date(inv.date) : inv.created_at ? new Date(inv.created_at) : new Date()
        const createdAt = inv.created_at ? new Date(inv.created_at) : dateValue
        const itemsCount = countsByInvoice.get(inv.id) ?? 0

        return {
          id: inv.id,
          supplier: supplier?.name || "Fournisseur",
          supplierValue: inv.supplier_id || "",
          reference: formatInvoiceReference(inv.invoice_number, inv.id),
          date: formatShortDate(dateValue),
          dateValue,
          createdAt,
          items: itemsCount ? `${itemsCount} articles` : "--",
          ht: formatCurrencyValue(totals.ht),
          tva: formatCurrencyValue(totals.tva),
          ttc: formatCurrencyValue(totals.ttc),
          ttcValue: totals.ttc ?? undefined,
        }
      })

      setInvoices(mappedInvoices)
      setSupplierOptions(
        suppliers.map((supplier) => ({
          value: supplier.id,
          label: supplier.name || "Fournisseur",
        }))
      )
    } catch (err) {
      setError("Impossible de charger les factures.")
      setInvoices([])
      setSupplierOptions([])
    } finally {
      setIsLoading(false)
    }
  }, [estId])

  useEffect(() => {
    load()
  }, [load])

  return { invoices, supplierOptions, isLoading, error, refresh: load }
}

const buildPriceHistory = (
  variations: ApiVariation[],
  fallbackDate: Date,
  fallbackValue?: number | null
): InvoicePricePoint[] => {
  const points: InvoicePricePoint[] = variations
    .map((variation) => {
      if (!variation.date) return null
      const value = toNumber(variation.new_unit_price)
      if (value === null) return null
      const date = new Date(variation.date)
      if (Number.isNaN(date.getTime())) return null
      return {
        date,
        value,
        label: formatShortDateLabel(date),
      }
    })
    .filter((point): point is InvoicePricePoint => Boolean(point))
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  if (points.length) {
    return points
  }

  if (fallbackValue !== null && fallbackValue !== undefined && Number.isFinite(fallbackValue)) {
    return [
      {
        date: fallbackDate,
        value: fallbackValue,
        label: formatShortDateLabel(fallbackDate),
      },
    ]
  }

  return []
}

export const useInvoiceDetailData = (invoiceId?: string | null, estId?: string | null) => {
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
  const [priceHistoryById, setPriceHistoryById] = useState<Record<string, InvoicePricePoint[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!invoiceId) return
    setIsLoading(true)
    setError(null)

    try {
      const [detailRes, invoiceRes] = await Promise.all([
        api.get<ApiInvoiceDetailResponse>(`/invoices/${invoiceId}/details`),
        api.get<ApiInvoice>(`/invoices/${invoiceId}`),
      ])

      const detail = detailRes.data ?? {}
      const invoiceData = invoiceRes.data ?? detail.invoice

      if (!invoiceData) {
        setInvoice(null)
        setIsLoading(false)
        return
      }

      const supplierId = invoiceData.supplier_id
      const supplierRes = supplierId ? await api.get<ApiSupplier>(`/suppliers/${supplierId}`) : null
      const supplier = supplierRes?.data

      const articleRows = detail.articles ?? []
      const masterIds = Array.from(
        new Set(articleRows.map((article) => article.master_article_id).filter(Boolean))
      ) as string[]

      const masterMap = new Map<string, ApiMasterArticle>()
      await Promise.allSettled(
        masterIds.map(async (id) => {
          const response = await api.get<ApiMasterArticle>(`/master_articles/${id}`)
          if (response.data?.id) {
            masterMap.set(response.data.id, response.data)
          }
        })
      )

      const totals = getInvoiceTotals(invoiceData)
      const invoiceDateValue = invoiceData.date ? new Date(invoiceData.date) : null
      const fallbackDate = invoiceDateValue && !Number.isNaN(invoiceDateValue.getTime())
        ? invoiceDateValue
        : new Date()

      const items: InvoiceItem[] = articleRows.map((article) => {
        const master = article.master_article_id ? masterMap.get(article.master_article_id) : undefined
        const itemName = article.name || master?.name || master?.unformatted_name || "Article"
        const unit = article.unit || master?.unit || "—"
        const unitPriceValue = toNumber(article.unit_price)
        const unitPrice = unitPriceValue !== null ? formatEuroFromNumber(unitPriceValue) : "—"
        const quantityValue = toNumber(article.quantity)
        const quantity = quantityValue !== null ? formatQuantityValue(quantityValue) : "—"
        const totalValue = toNumber(article.total)
        const computedTotal =
          totalValue !== null
            ? totalValue
            : quantityValue !== null && unitPriceValue !== null
              ? quantityValue * unitPriceValue
              : null
        const lineTotal = computedTotal !== null ? formatEuroFromNumber(computedTotal) : "—"
        const delta = formatDeltaPercent(toNumber(article.variation_percent))

        return {
          id: article.id,
          name: itemName,
          unit,
          quantity,
          unitPrice,
          lineTotal,
          delta,
          dutiesTaxes:
            article.duties_and_taxes !== null && article.duties_and_taxes !== undefined
              ? formatEuroFromNumber(article.duties_and_taxes)
              : "",
          discount:
            article.discounts !== null && article.discounts !== undefined
              ? formatEuroFromNumber(article.discounts)
              : "",
          masterArticleId: article.master_article_id ?? undefined,
        }
      })

      const supplierLabel = supplier?.label ?? ""
      const supplierType = supplierLabel.toLowerCase().includes("beverage") || supplierLabel.toLowerCase().includes("boisson")
        ? "beverage"
        : "other"

      const detailInvoice: InvoiceDetail = {
        number: formatInvoiceReference(invoiceData.invoice_number, invoiceData.id),
        lastModified: formatShortDate(invoiceData.updated_at ?? invoiceData.created_at ?? invoiceData.date),
        supplier: supplier?.name || "Fournisseur",
        supplierType,
        date: formatLongDate(invoiceData.date),
        importedAt: formatShortDate(invoiceData.created_at ?? invoiceData.date),
        documentUrl: invoiceData.file_storage_path ?? undefined,
        pageCount: 1,
        totals: {
          ht: formatCurrencyValue(totals.ht),
          tva: formatCurrencyValue(totals.tva),
          ttc: formatCurrencyValue(totals.ttc),
        },
        items,
      }

      const variationsRes = estId
        ? await api.get<ApiVariation[]>("/variations", {
            params: {
              establishment_id: estId,
              order_by: "date",
              direction: "asc",
              limit: 2000,
            },
          })
        : { data: [] as ApiVariation[] }

      const variations = variationsRes.data ?? []
      const variationsByMaster = new Map<string, ApiVariation[]>()
      variations.forEach((variation) => {
        if (!variation.master_article_id) return
        const current = variationsByMaster.get(variation.master_article_id) ?? []
        current.push(variation)
        variationsByMaster.set(variation.master_article_id, current)
      })

      const historyMap: Record<string, InvoicePricePoint[]> = {}
      items.forEach((item) => {
        const key = item.masterArticleId ?? item.name
        const history = key && variationsByMaster.has(key)
          ? buildPriceHistory(
              variationsByMaster.get(key) ?? [],
              fallbackDate,
              parseNumber(item.unitPrice)
            )
          : buildPriceHistory([], fallbackDate, parseNumber(item.unitPrice))
        historyMap[key] = history
      })

      setInvoice(detailInvoice)
      setPriceHistoryById(historyMap)
    } catch (err) {
      setError("Impossible de charger la facture.")
      setInvoice(null)
      setPriceHistoryById({})
    } finally {
      setIsLoading(false)
    }
  }, [estId, invoiceId])

  useEffect(() => {
    load()
  }, [load])

  return { invoice, priceHistoryById, isLoading, error, refresh: load }
}

export const updateSupplier = async (supplierId: string, payload: Partial<ApiSupplier>) => {
  const response = await api.patch<ApiSupplier>(`/suppliers/${supplierId}`, payload)
  return response.data
}

export const createSupplierMergeRequest = async (payload: {
  target_market_supplier_id: string
  source_market_supplier_ids: string[]
  requesting_establishment_id: string
}) => {
  const response = await api.post<ApiSupplierMergeRequest>("/supplier_merge_request", payload)
  return response.data
}

export const updateInvoice = async (invoiceId: string, payload: Partial<ApiInvoice>) => {
  const response = await api.patch<ApiInvoice>(`/invoices/${invoiceId}`, payload)
  return response.data
}

export const updateArticle = async (articleId: string, payload: Partial<ApiInvoiceDetailArticle>) => {
  const response = await api.patch<ApiInvoiceDetailArticle>(`/articles/${articleId}`, payload)
  return response.data
}

export const useSuppliersData = (estId?: string | null) => {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([])
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([])
  const [marketSuppliersById, setMarketSuppliersById] = useState<Map<string, ApiMarketSupplier>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!estId) return
    setIsLoading(true)
    setError(null)

    try {
      const [suppliersRes, invoicesRes, mergeRes, marketRes] = await Promise.all([
        api.get<ApiSupplier[]>("/suppliers", {
          params: {
            establishment_id: estId,
            order_by: "name",
            direction: "asc",
            limit: 1000,
          },
        }),
        api.get<ApiInvoice[]>("/invoices", {
          params: {
            establishment_id: estId,
            order_by: "date",
            direction: "desc",
            limit: 2000,
          },
        }),
        api.get<ApiSupplierMergeRequest[]>("/supplier_merge_request", {
          params: {
            order_by: "created_at",
            direction: "desc",
            limit: 200,
            requesting_establishment_id: estId,
          },
        }),
        api.get<ApiMarketSupplier[]>("/market_suppliers", {
          params: { order_by: "name", direction: "asc", limit: 2000 },
        }),
      ])

      const suppliersRaw = suppliersRes.data ?? []
      const invoicesRaw = invoicesRes.data ?? []
      const mergeRaw = mergeRes.data ?? []
      const marketSuppliers = marketRes.data ?? []

      const invoiceCounts = new Map<string, number>()
      invoicesRaw.forEach((invoice) => {
        if (!invoice.supplier_id) return
        invoiceCounts.set(invoice.supplier_id, (invoiceCounts.get(invoice.supplier_id) ?? 0) + 1)
      })

      const suppliersMapped: SupplierRow[] = suppliersRaw.map((supplier) => {
        const displayLabel = formatSupplierLabel(supplier.label)
        return {
          id: supplier.id,
          name: supplier.name || "Fournisseur",
          invoicesCount: invoiceCounts.get(supplier.id) ?? 0,
          label: displayLabel,
          labelTone: getSupplierLabelTone(supplier.label),
          analyses: Boolean(supplier.active_analyses),
          marketSupplierId: supplier.market_supplier_id ?? null,
          labelValue: supplier.label ?? null,
        }
      })

      const marketMap = new Map<string, ApiMarketSupplier>()
      marketSuppliers.forEach((supplier) => {
        if (supplier.id) marketMap.set(supplier.id, supplier)
      })

      const statusLabels: Record<string, string> = {
        pending: "En attente",
        to_confirm: "À confirmer",
        accepted: "Validée",
        resolved: "Résolue",
        refused: "Refusée",
      }

      const mergeMapped: MergeRequest[] = mergeRaw.map((request) => {
        const targetName = request.target_market_supplier_id
          ? marketMap.get(request.target_market_supplier_id)?.name
          : undefined
        const sourceIds = Array.isArray(request.source_market_supplier_ids)
          ? request.source_market_supplier_ids
          : []
        const sources = sourceIds
          .map((id) => marketMap.get(id)?.name)
          .filter(Boolean) as string[]
        return {
          id: request.id,
          date: formatShortDate(request.created_at),
          target: targetName || "Fournisseur",
          sources: sources.length ? sources : ["-"],
          status: statusLabels[request.status ?? ""] ?? "En attente",
        }
      })

      setSuppliers(suppliersMapped)
      setSupplierOptions(
        suppliersRaw.map((supplier) => ({
          value: supplier.id,
          label: supplier.name || "Fournisseur",
        }))
      )
      setMergeRequests(mergeMapped)
      setMarketSuppliersById(marketMap)
    } catch (err) {
      setError("Impossible de charger les fournisseurs.")
      setSuppliers([])
      setSupplierOptions([])
      setMergeRequests([])
      setMarketSuppliersById(new Map())
    } finally {
      setIsLoading(false)
    }
  }, [estId])

  useEffect(() => {
    load()
  }, [load])

  return { suppliers, supplierOptions, mergeRequests, marketSuppliersById, isLoading, error, refresh: load }
}
