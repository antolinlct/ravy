import { useEffect, useMemo, useState } from "react"
import api from "@/lib/axiosClient"
import type {
  MarketOverviewResponse,
  MarketProductOption,
  MarketProductRow,
  MarketProductStats,
  MarketProductUser,
  MarketSupplierOption,
  PricePoint,
} from "./types"

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toIsoDate = (value?: Date) => {
  if (!value) return undefined
  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, "0")
  const day = `${value.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

export type MarketOverviewQuery = {
  establishmentId: string
  startDate?: Date
  endDate?: Date
  supplierId?: string
}

export const fetchMarketOverview = async ({
  establishmentId,
  startDate,
  endDate,
  supplierId,
}: MarketOverviewQuery): Promise<MarketOverviewResponse> => {
  const start = toIsoDate(startDate)
  const end = toIsoDate(endDate)
  const params: Record<string, string | number | boolean | undefined> = {
    establishment_id: establishmentId,
    supplier_id: supplierId,
    include_user_comparison: true,
  }
  if (start && end) {
    params.start_date = start
    params.end_date = end
  } else {
    params.period_range = 3
  }
  const res = await api.get<MarketOverviewResponse>("/market/overview", { params })
  return res.data ?? { suppliers: [] }
}

export type MarketOverviewData = {
  supplierOptions: MarketSupplierOption[]
  productOptions: MarketProductOption[]
  marketProductRows: MarketProductRow[]
  priceSeriesByProduct: Record<string, PricePoint[]>
  statsByProductId: Record<string, MarketProductStats>
  userByProductId: Record<string, MarketProductUser>
  productUsageById: Record<string, { monthlyQty: number }>
  isLoading: boolean
  error: string | null
}

export const useMarketOverviewData = ({
  establishmentId,
  startDate,
  endDate,
  supplierId,
}: MarketOverviewQuery): MarketOverviewData => {
  const [data, setData] = useState<MarketOverviewResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!establishmentId) {
      setData(null)
      return
    }
    let active = true
    setIsLoading(true)
    setError(null)
    fetchMarketOverview({
      establishmentId,
      startDate,
      endDate,
      supplierId,
    })
      .then((response) => {
        if (!active) return
        setData(response)
      })
      .catch(() => {
        if (!active) return
        setError("Impossible de charger la base marché.")
        setData(null)
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [establishmentId, startDate, endDate, supplierId])

  const derived = useMemo(() => {
    const supplierOptions: MarketSupplierOption[] = []
    const productOptions: MarketProductOption[] = []
    const marketProductRows: MarketProductRow[] = []
    const priceSeriesByProduct: Record<string, PricePoint[]> = {}
    const statsByProductId: Record<string, MarketProductStats> = {}
    const userByProductId: Record<string, MarketProductUser> = {}
    const productUsageById: Record<string, { monthlyQty: number }> = {}

    const supplierMeta = new Map<
      string,
      { label: string; usedByUser: boolean }
    >()

    const blocks = data?.suppliers ?? []
    blocks.forEach((block) => {
      const supplier = block.market_supplier
      if (!supplier?.id) return
      const supplierId = supplier.id
      const supplierLabel = supplier.name ?? "Fournisseur"
      const products = block.products ?? []
      let usedByUser = supplierMeta.get(supplierId)?.usedByUser ?? false

      products.forEach((product) => {
        const meta = product.market_master_article
        const productId = meta?.id
        if (!productId) return

        const productLabel = meta?.name ?? meta?.unformatted_name ?? "Produit"
        const unit = meta?.unit ?? "—"

        productOptions.push({
          id: productId,
          label: productLabel,
          supplierId,
          unit,
        })

        marketProductRows.push({
          id: `product-${productId}`,
          rowType: "product",
          productId,
          supplierId,
          supplierLabel,
          productLabel,
          unit,
        })

        const series =
          product.series_daily?.map((point) => ({
            date: point.date,
            value: toNumber(point.avg_unit_price) ?? 0,
          })) ?? []
        series.sort((a, b) => a.date.localeCompare(b.date))
        priceSeriesByProduct[productId] = series

        const stats = product.stats ?? {}
        statsByProductId[productId] = {
          ...stats,
          avg_unit_price: toNumber(stats.avg_unit_price),
          min_unit_price: toNumber(stats.min_unit_price),
          max_unit_price: toNumber(stats.max_unit_price),
          last_unit_price: toNumber(stats.last_unit_price),
          count_purchases: toNumber(stats.count_purchases),
          variation_euro: toNumber(stats.variation_euro),
          variation_percent: toNumber(stats.variation_percent),
          market_volatility_index: toNumber(stats.market_volatility_index),
          days_since_last: toNumber(stats.days_since_last),
        }

        const user = product.user ?? {}
        const hasPurchased = Boolean(user.has_purchased)
        if (hasPurchased) usedByUser = true
        userByProductId[productId] = {
          ...user,
          user_avg_unit_price: toNumber(user.user_avg_unit_price),
          user_last_unit_price: toNumber(user.user_last_unit_price),
          user_vs_market_eur: toNumber(user.user_vs_market_eur),
          user_vs_market_percent: toNumber(user.user_vs_market_percent),
          potential_saving_eur: toNumber(user.potential_saving_eur),
          deal_score: toNumber(user.deal_score),
          recommendation_badge: user.recommendation_badge ?? null,
        }

        const usageCount = toNumber(stats.count_purchases)
        if (usageCount !== null) {
          productUsageById[productId] = { monthlyQty: usageCount }
        }
      })

      supplierMeta.set(supplierId, { label: supplierLabel, usedByUser })
    })

    supplierMeta.forEach((value, key) => {
      supplierOptions.push({ id: key, label: value.label, usedByUser: value.usedByUser })
    })

    supplierOptions.sort((a, b) => a.label.localeCompare(b.label, "fr"))
    productOptions.sort((a, b) => a.label.localeCompare(b.label, "fr"))
    marketProductRows.sort((a, b) => {
      if (a.supplierLabel === b.supplierLabel) {
        return a.productLabel.localeCompare(b.productLabel, "fr")
      }
      return a.supplierLabel.localeCompare(b.supplierLabel, "fr")
    })

    return {
      supplierOptions,
      productOptions,
      marketProductRows,
      priceSeriesByProduct,
      statsByProductId,
      userByProductId,
      productUsageById,
    }
  }, [data])

  return {
    ...derived,
    isLoading,
    error,
  }
}
