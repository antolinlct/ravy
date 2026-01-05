import { useCallback, useEffect, useMemo, useState } from "react"
import type {
  ColDef,
  GetRowIdParams,
  IHeaderParams,
  PostSortRowsParams,
  RowClassParams,
  RowHeightParams,
} from "ag-grid-community"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Flame,
  Info,
  Plus,
  Rocket,
  Skull,
} from "lucide-react"

import ConsultantAvatar from "@/assets/avatar.png"
import { useEstablishment } from "@/context/EstablishmentContext"
import { useTheme } from "@/components/dark/theme-provider"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ChartConfig } from "@/components/ui/chart"
import type { IntervalKey } from "@/components/blocks/area-chart"
import { cn } from "@/lib/utils"
import { useMarketOverviewData } from "./api"
import type { MarketGridRow, MarketProductRow, PricePoint } from "./types"
import { MarketComparatorCard } from "./components/MarketComparatorCard"
import { MarketDatabaseCard } from "./components/MarketDatabaseCard"
import { MarketProductSheet } from "./components/MarketProductSheet"

type InterestHeaderProps = IHeaderParams<MarketGridRow>

const InterestHeader = ({
  displayName,
  enableSorting,
  progressSort,
  column,
}: InterestHeaderProps) => {
  const label = displayName ?? "Interet"
  const [sort, setSort] = useState<"asc" | "desc" | null>(column?.getSort() ?? null)

  useEffect(() => {
    if (!column) return
    const handleSortChanged = () => {
      setSort(column.getSort() ?? null)
    }
    column.addEventListener("sortChanged", handleSortChanged)
    return () => {
      column.removeEventListener("sortChanged", handleSortChanged)
    }
  }, [column])

  const SortIcon = sort === "asc" ? ChevronUp : sort === "desc" ? ChevronDown : ChevronsUpDown

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          if (enableSorting && progressSort) {
            progressSort(event.shiftKey)
          }
        }}
        className="inline-flex items-center gap-1 text-sm font-medium text-foreground"
      >
        <span>{label}</span>
        {enableSorting ? (
          <SortIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        ) : null}
      </button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Informations sur l'interet"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Pourcentage de restaurateurs achetant ce produit sur la periode.
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

const RECOMMENDATION_RANK: Record<string, number> = {
  "Très bon prix": 6,
  "Bon prix": 5,
  "Très demandé": 4,
  "Dans la moyenne": 3,
  "Intérêt faible": 2,
  "À surveiller": 2,
  "Prix instable": 1,
  "Données anciennes": 0,
}
const FULL_COLUMN_OPTIONS = [
  { id: "volatility", label: "Volatilité" },
  { id: "avgPrice", label: "Prix moyen" },
  { id: "variation", label: "Variation" },
  { id: "lastPrice", label: "Dernier prix" },
  { id: "updatedAt", label: "Mise à jour" },
  { id: "interest", label: "Intérêt" },
  { id: "recommendation", label: "Recommandations" },
]

const axisDayFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
})
const axisMonthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "short",
  year: "2-digit",
})
const tooltipDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
})
const formatAxisLabel = (date: Date, interval: IntervalKey) => {
  if (interval === "month") {
    return axisMonthFormatter.format(date)
  }
  return axisDayFormatter.format(date)
}

const normalizeSearchValue = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

const formatTooltipDate = (date: Date) => {
  const label = tooltipDateFormatter.format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const getIntervalStart = (date: Date, interval: IntervalKey) => {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  if (interval === "week") {
    const day = copy.getDay()
    const diff = day === 0 ? -6 : 1 - day
    copy.setDate(copy.getDate() + diff)
  }
  if (interval === "month") {
    copy.setDate(1)
  }
  return copy
}

export default function MarketPurchasesPage() {
  const { estId } = useEstablishment()
  const { theme = "system" } = useTheme()
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [productSearch, setProductSearch] = useState("")
  const [hiddenColumnIds, setHiddenColumnIds] = useState<Set<string>>(() => new Set())
  const [comparisonRange, setComparisonRange] = useState<{ start?: Date; end?: Date }>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 3)
    return { start, end }
  })
  const [comparisonInterval, setComparisonInterval] = useState<IntervalKey>("month")
  const {
    supplierOptions,
    productOptions,
    marketProductRows,
    priceSeriesByProduct,
    productUsageById,
    statsByProductId,
    userByProductId,
    isLoading: isMarketLoading,
    error: marketError,
  } = useMarketOverviewData({
    establishmentId: estId ?? "",
    startDate: comparisonRange.start,
    endDate: comparisonRange.end,
  })
  const maxProductMonthlyQty = useMemo(() => {
    const values = Object.values(productUsageById)
      .map((usage) => usage.monthlyQty)
      .filter((value) => Number.isFinite(value) && value > 0)
    return values.length ? Math.max(...values) : 1
  }, [productUsageById])
  const marketStatus = useMemo(() => {
    if (!estId) {
      return { tone: "text-muted-foreground", label: "Sélectionnez un établissement." }
    }
    if (isMarketLoading) {
      return { tone: "text-muted-foreground", label: "Chargement des données marché..." }
    }
    if (marketError) {
      return { tone: "text-destructive", label: marketError }
    }
    return null
  }, [estId, isMarketLoading, marketError])
  const [leftSupplierId, setLeftSupplierId] = useState("")
  const [leftProductId, setLeftProductId] = useState("")
  const [rightSupplierId, setRightSupplierId] = useState("")
  const [rightProductId, setRightProductId] = useState("")
  const rightSupplierUsed = useMemo(
    () => supplierOptions.find((supplier) => supplier.id === rightSupplierId)?.usedByUser ?? false,
    [rightSupplierId, supplierOptions]
  )
  const supplierFilterOptions = useMemo(
    () => supplierOptions.map((supplier) => ({ value: supplier.id, label: supplier.label })),
    [supplierOptions]
  )
  const normalizedProductQuery = useMemo(() => {
    const normalized = normalizeSearchValue(productSearch).trim()
    return normalized.length ? normalized.split(/\s+/).filter(Boolean) : []
  }, [productSearch])
  const leftProductLabel = useMemo(
    () => productOptions.find((product) => product.id === leftProductId)?.label ?? "Produit 1",
    [leftProductId, productOptions]
  )
  const rightProductLabel = useMemo(
    () => productOptions.find((product) => product.id === rightProductId)?.label ?? "Produit 2",
    [rightProductId, productOptions]
  )
  const monthlyQuantity = useMemo(() => {
    return (
      (leftProductId && productUsageById[leftProductId]?.monthlyQty) ||
      (rightProductId && productUsageById[rightProductId]?.monthlyQty) ||
      null
    )
  }, [leftProductId, productUsageById, rightProductId])
  const euroFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )
  const unitPriceFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )
  const updateDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    []
  )
  const comparisonChartConfig = useMemo(
    () =>
      ({
        left: { label: leftProductLabel, color: "var(--chart-1)" },
        right: { label: rightProductLabel, color: "var(--chart-5)" },
      }) satisfies ChartConfig,
    [leftProductLabel, rightProductLabel]
  )
  const comparisonChartData = useMemo(() => {
    if (!leftProductId && !rightProductId) return []
    const aggregateSeries = (points: PricePoint[]) => {
      const buckets = new Map<number, { total: number; count: number }>()
      points.forEach((point) => {
        const parsed = new Date(point.date)
        if (Number.isNaN(parsed.getTime())) return
        if (comparisonRange.start && parsed < comparisonRange.start) return
        if (comparisonRange.end && parsed > comparisonRange.end) return
        const bucketDate = getIntervalStart(parsed, comparisonInterval)
        const key = bucketDate.getTime()
        const current = buckets.get(key) ?? { total: 0, count: 0 }
        buckets.set(key, { total: current.total + point.value, count: current.count + 1 })
      })
      return Array.from(buckets.entries())
        .map(([timestamp, summary]) => ({
          date: new Date(timestamp),
          value: summary.total / summary.count,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
    }
    const leftSeries = leftProductId
      ? aggregateSeries(priceSeriesByProduct[leftProductId] ?? [])
      : []
    const rightSeries = rightProductId
      ? aggregateSeries(priceSeriesByProduct[rightProductId] ?? [])
      : []
    const allDates = Array.from(
      new Set([...leftSeries, ...rightSeries].map((point) => point.date.getTime()))
    )
      .sort((a, b) => a - b)
      .map((timestamp) => new Date(timestamp))
    const leftLookup = new Map(leftSeries.map((point) => [point.date.getTime(), point.value]))
    const rightLookup = new Map(rightSeries.map((point) => [point.date.getTime(), point.value]))
    let lastLeft: number | null = leftSeries.length ? leftSeries[0].value : null
    let lastRight: number | null = rightSeries.length ? rightSeries[0].value : null
    return allDates.map((date) => {
      const time = date.getTime()
      if (leftLookup.has(time)) {
        lastLeft = leftLookup.get(time) ?? null
      }
      if (rightLookup.has(time)) {
        lastRight = rightLookup.get(time) ?? null
      }
      return {
        date,
        label: formatAxisLabel(date, comparisonInterval),
        left: leftProductId ? lastLeft : null,
        right: rightProductId ? lastRight : null,
      }
    })
  }, [
    comparisonInterval,
    comparisonRange.end,
    comparisonRange.start,
    leftProductId,
    priceSeriesByProduct,
    rightProductId,
  ])
  const hasLeftSelection = Boolean(leftSupplierId && leftProductId)
  const hasRightSelection = Boolean(rightSupplierId && rightProductId)
  const hasChartValues = useMemo(
    () =>
      comparisonChartData.some(
        (point) =>
          (hasLeftSelection && point.left !== null && point.left !== undefined) ||
          (hasRightSelection && point.right !== null && point.right !== undefined)
      ),
    [comparisonChartData, hasLeftSelection, hasRightSelection]
  )
  const leftStats = useMemo(() => {
    if (!hasLeftSelection) return null
    const values = comparisonChartData
      .map((point) => point.left)
      .filter((value): value is number => typeof value === "number")
    if (!values.length) return null
    let last: number | null = null
    for (let index = comparisonChartData.length - 1; index >= 0; index -= 1) {
      const value = comparisonChartData[index]?.left
      if (typeof value === "number") {
        last = value
        break
      }
    }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((total, value) => total + value, 0) / values.length,
      last,
    }
  }, [comparisonChartData, hasLeftSelection])
  const rightStats = useMemo(() => {
    if (!hasRightSelection) return null
    const values = comparisonChartData
      .map((point) => point.right)
      .filter((value): value is number => typeof value === "number")
    if (!values.length) return null
    let last: number | null = null
    for (let index = comparisonChartData.length - 1; index >= 0; index -= 1) {
      const value = comparisonChartData[index]?.right
      if (typeof value === "number") {
        last = value
        break
      }
    }
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((total, value) => total + value, 0) / values.length,
      last,
    }
  }, [comparisonChartData, hasRightSelection])
  const gapStats = useMemo(() => {
    if (leftStats?.avg === undefined || rightStats?.avg === undefined) return null
    const delta = rightStats.avg - leftStats.avg
    const percent = leftStats.avg !== 0 ? (delta / leftStats.avg) * 100 : null
    return { delta, percent }
  }, [leftStats?.avg, rightStats?.avg])
  const consultantMessage = useMemo(() => {
    if (!hasLeftSelection || !hasRightSelection || !gapStats) {
      return "Sélectionnez deux produits pour obtenir une recommandation ciblée."
    }
    const leftName = leftProductLabel
    const rightName = rightProductLabel
    const deltaAbs = Math.abs(gapStats.delta)
    const percentAbs =
      gapStats.percent !== null && gapStats.percent !== undefined
        ? Math.abs(gapStats.percent)
        : null
    const isSimilar = percentAbs !== null && percentAbs <= 3
    const deltaLabel = euroFormatter.format(deltaAbs)
    const percentLabel = percentAbs !== null ? `${percentAbs.toFixed(1)}%` : "—"
    const deltaToneClass =
      gapStats.delta < 0
        ? "text-green-500"
        : gapStats.delta > 0
          ? "text-red-500"
          : "text-muted-foreground"
    const deltaNode = (
      <span className={cn("font-medium", deltaToneClass)}>
        {deltaLabel} ({percentLabel})
      </span>
    )
    const monthlyEconomy =
      monthlyQuantity !== null && Number.isFinite(monthlyQuantity)
        ? deltaAbs * monthlyQuantity
        : null
    const monthlyNode =
      monthlyEconomy !== null ? (
        <span className={cn("font-medium", deltaToneClass)}>
          {euroFormatter.format(monthlyEconomy)}/mois
        </span>
      ) : null
    if (percentAbs === null) {
      return (
        <>
          Les données ne permettent pas de calculer un écart fiable. Vérifiez les prix moyens et la
          qualité de service pour trancher entre {leftName} et {rightName}.
        </>
      )
    }
    const monthlySuffix = monthlyNode ? <> ; soit ~{monthlyNode}</> : null
    if (isSimilar) {
      return (
        <>
          Les prix sont quasiment similaires (écart ~{deltaNode}). Basez votre choix sur la
          logistique, la relation fournisseur, la fiabilité des livraisons et la qualité du produit.
        </>
      )
    }
    if (gapStats.delta < 0) {
      if (!rightSupplierUsed) {
        return (
          <>
            Vous réaliserez des économies en passant à {rightName} (écart ~{deltaNode}
            {monthlySuffix}). Soyez prudent : vous n’avez jamais travaillé avec ce fournisseur.
            Vérifiez la fiabilité, le franco de port et la qualité avant de basculer.
          </>
        )
      }
      return (
        <>
          {rightName} est plus avantageux (écart ~{deltaNode}
          {monthlySuffix}). Il est chez un fournisseur déjà utilisé : vous pouvez centraliser vos
          commandes et optimiser vos seuils.
        </>
      )
    }
    if (rightSupplierUsed) {
      return (
        <>
          Restez sur {leftName}. Pas besoin de centraliser si cela coûte plus cher au final (écart ~
          {deltaNode}
          {monthlySuffix}).
        </>
      )
    }
    return (
      <>
        Aucun intérêt économique. {rightName} est plus cher que {leftName} (écart ~{deltaNode}
        {monthlySuffix}). Restez sur {leftName} sauf cas particulier (qualité, dispo, fiabilité).
      </>
    )
  }, [
    euroFormatter,
    gapStats,
    hasLeftSelection,
    hasRightSelection,
    leftProductLabel,
    monthlyQuantity,
    rightProductLabel,
    rightSupplierUsed,
  ])
  const agThemeMode = useMemo<"light" | "dark">(() => {
    if (theme === "system") {
      if (typeof window === "undefined") return "light"
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
  }, [theme])
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Set<string>>(() => new Set())
  const toggleSupplierGroup = useCallback((supplierId: string) => {
    setCollapsedSuppliers((prev) => {
      const next = new Set(prev)
      if (next.has(supplierId)) {
        next.delete(supplierId)
      } else {
        next.add(supplierId)
      }
      return next
    })
  }, [])
  const marketGridRows = useMemo<MarketGridRow[]>(() => {
    const matchesQuery = (label: string) => {
      if (normalizedProductQuery.length === 0) return true
      const normalizedLabel = normalizeSearchValue(label)
      return normalizedProductQuery.every((token) => normalizedLabel.includes(token))
    }
    const productsBySupplier = new Map<string, MarketProductRow[]>()
    marketProductRows.forEach((product) => {
      if (!matchesQuery(product.productLabel)) return
      const bucket = productsBySupplier.get(product.supplierId)
      if (bucket) {
        bucket.push(product)
      } else {
        productsBySupplier.set(product.supplierId, [product])
      }
    })
    const rows: MarketGridRow[] = []
    const activeSuppliers =
      selectedSuppliers.length > 0
        ? supplierOptions.filter((supplier) => selectedSuppliers.includes(supplier.id))
        : supplierOptions
    activeSuppliers.forEach((supplier) => {
      const products = productsBySupplier.get(supplier.id) ?? []
      if (normalizedProductQuery.length > 0 && products.length === 0) return
      rows.push({
        id: `group-${supplier.id}`,
        rowType: "group",
        supplierId: supplier.id,
        supplierLabel: supplier.label,
        productCount: products.length,
      })
      if (normalizedProductQuery.length > 0 || !collapsedSuppliers.has(supplier.id)) {
        products.forEach((product) => {
          rows.push(product)
        })
      }
    })
    return rows
  }, [collapsedSuppliers, marketProductRows, normalizedProductQuery, selectedSuppliers, supplierOptions])
  const marketGetRowId = useCallback((params: GetRowIdParams<MarketGridRow>) => {
    return params.data?.id ?? ""
  }, [])
  const marketRowHeight = useCallback((params: RowHeightParams<MarketGridRow>) => {
    if (params.data?.rowType === "group") return 40
    return 40
  }, [])
  const marketGetRowClass = useCallback((params: RowClassParams<MarketGridRow>) => {
    if (params.data?.rowType === "group") return "!bg-sidebar"
    return "!bg-white dark:!bg-black"
  }, [])
  const getProductVolatility = useCallback(
    (productId: string) => {
      const stats = statsByProductId[productId]
      const minValue = stats?.min_unit_price ?? null
      const maxValue = stats?.max_unit_price ?? null
      if (typeof minValue === "number" && typeof maxValue === "number") {
        return { min: minValue, max: maxValue }
      }
      const points = priceSeriesByProduct[productId] ?? []
      if (!points.length) return null
      const values = points.map((point) => point.value)
      return { min: Math.min(...values), max: Math.max(...values) }
    },
    [priceSeriesByProduct, statsByProductId]
  )
  const getProductAverage = useCallback(
    (productId: string) => {
      const stats = statsByProductId[productId]
      if (typeof stats?.avg_unit_price === "number") return stats.avg_unit_price
      const points = priceSeriesByProduct[productId] ?? []
      if (!points.length) return null
      const total = points.reduce((sum, point) => sum + point.value, 0)
      return total / points.length
    },
    [priceSeriesByProduct, statsByProductId]
  )
  const getProductVariation = useCallback(
    (productId: string) => {
      const stats = statsByProductId[productId]
      if (typeof stats?.variation_percent === "number") return stats.variation_percent
      const points = priceSeriesByProduct[productId] ?? []
      if (points.length < 2) return null
      const first = points[0]?.value ?? null
      const last = points[points.length - 1]?.value ?? null
      if (first === null || last === null || first === 0) return null
      return ((last - first) / first) * 100
    },
    [priceSeriesByProduct, statsByProductId]
  )
  const getProductLastPrice = useCallback(
    (productId: string) => {
      const stats = statsByProductId[productId]
      if (typeof stats?.last_unit_price === "number") return stats.last_unit_price
      const points = priceSeriesByProduct[productId] ?? []
      if (!points.length) return null
      return points[points.length - 1]?.value ?? null
    },
    [priceSeriesByProduct, statsByProductId]
  )
  const getProductLastDate = useCallback(
    (productId: string): Date | null => {
      const stats = statsByProductId[productId]
      const lastDate = stats?.last_purchase_date
      if (lastDate) {
        const parsed = new Date(lastDate)
        if (!Number.isNaN(parsed.getTime())) return parsed
      }
      const points = priceSeriesByProduct[productId] ?? []
      if (!points.length) return null
      let latest: Date | null = null
      points.forEach((point) => {
        const parsed = new Date(point.date)
        if (Number.isNaN(parsed.getTime())) return
        if (!latest || parsed > latest) {
          latest = parsed
        }
      })
      return latest
    },
    [priceSeriesByProduct, statsByProductId]
  )
  const formatUpdateDate = useCallback(
    (date: Date) => {
      const parts = updateDateFormatter.formatToParts(date)
      const day = parts.find((part) => part.type === "day")?.value
      const month = parts.find((part) => part.type === "month")?.value
      const year = parts.find((part) => part.type === "year")?.value
      if (!day || !month || !year) return updateDateFormatter.format(date)
      return `${day} ${month}, ${year}`
    },
    [updateDateFormatter]
  )
  const getProductLastUpdated = useCallback(
    (productId: string) => {
      const lastDate = getProductLastDate(productId)
      if (!lastDate) return null
      return formatUpdateDate(lastDate)
    },
    [formatUpdateDate, getProductLastDate]
  )
  const getDaysSinceLastUpdate = useCallback(
    (productId: string) => {
      const stats = statsByProductId[productId]
      if (typeof stats?.days_since_last === "number") return stats.days_since_last
      const lastDate = getProductLastDate(productId)
      if (!lastDate) return null
      const diffMs = Date.now() - lastDate.getTime()
      if (diffMs < 0) return null
      return Math.floor(diffMs / (1000 * 60 * 60 * 24))
    },
    [getProductLastDate, statsByProductId]
  )
  const getUserVsMarketPercent = useCallback(
    (productId: string) => {
      const user = userByProductId[productId]
      return typeof user?.user_vs_market_percent === "number" ? user.user_vs_market_percent : null
    },
    [userByProductId]
  )
  const getMarketVolatilityIndex = useCallback(
    (productId: string) => {
      const stats = statsByProductId[productId]
      if (typeof stats?.market_volatility_index === "number") {
        return stats.market_volatility_index
      }
      const avg = getProductAverage(productId)
      const volatility = getProductVolatility(productId)
      if (!avg || !volatility) return null
      return (volatility.max - volatility.min) / avg
    },
    [getProductAverage, getProductVolatility, statsByProductId]
  )
  const getInterestPercent = useCallback(
    (productId: string) => {
      const monthlyQty = productUsageById[productId]?.monthlyQty
      if (!monthlyQty) return null
      return Math.round((monthlyQty / maxProductMonthlyQty) * 100)
    },
    [maxProductMonthlyQty, productUsageById]
  )
  const getInterestTone = useCallback((interest: number) => {
    if (interest >= 50) return { icon: Rocket, className: "text-green-500" }
    if (interest >= 20) return { icon: Flame, className: "text-orange-500" }
    return { icon: Skull, className: "text-red-500" }
  }, [])
  const getRecommendationBadge = useCallback(
    (productId: string) => {
      const user = userByProductId[productId]
      if (user?.recommendation_badge) return user.recommendation_badge
      const userVsPct = getUserVsMarketPercent(productId)
      const volIndex = getMarketVolatilityIndex(productId)
      const daysSince = getDaysSinceLastUpdate(productId)
      const interest = getInterestPercent(productId)
      const hasSignal =
        userVsPct !== null || volIndex !== null || daysSince !== null || interest !== null
      if (!hasSignal) return null
      if (daysSince !== null && daysSince > 45) return "Données anciennes"
      if (volIndex !== null && volIndex > 0.25) return "Prix instable"
      if (userVsPct !== null && userVsPct <= -5) return "Bon prix"
      if (userVsPct !== null && userVsPct >= 5) return "À surveiller"
      if (interest !== null && interest >= 70) return "Très demandé"
      if (interest !== null && interest <= 30) return "Intérêt faible"
      return "Dans la moyenne"
    },
    [
      getDaysSinceLastUpdate,
      getInterestPercent,
      getMarketVolatilityIndex,
      getUserVsMarketPercent,
      userByProductId,
    ]
  )
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null
    return marketProductRows.find((product) => product.productId === selectedProductId) ?? null
  }, [marketProductRows, selectedProductId])
  const selectedProductMetrics = useMemo(() => {
    if (!selectedProduct) return null
    const productId = selectedProduct.productId
    return {
      avgPrice: getProductAverage(productId),
      lastPrice: getProductLastPrice(productId),
      updatedAt: getProductLastUpdated(productId),
      variation: getProductVariation(productId),
      volatility: getProductVolatility(productId),
      interest: getInterestPercent(productId),
      recommendation: getRecommendationBadge(productId),
    }
  }, [
    getInterestPercent,
    getProductAverage,
    getProductLastPrice,
    getProductLastUpdated,
    getProductVariation,
    getProductVolatility,
    getRecommendationBadge,
    selectedProduct,
  ])
  const consultantNote = useMemo(() => {
    if (!selectedProductMetrics) return null
    const interest = selectedProductMetrics.interest
    const variation = selectedProductMetrics.variation
    if (interest === null || interest === undefined || variation === null || variation === undefined) {
      return {
        title: "Données insuffisantes",
        message: "Je n'ai pas assez de données pour te conseiller correctement pour le moment.",
      }
    }
    const strongIncrease = variation >= 8
    if (interest >= 50) {
      if (strongIncrease) {
        return {
          title: "À surveiller",
          message:
            "La demande est forte mais la hausse est marquée. Attends un meilleur timing ou renégocie.",
        }
      }
      if (variation <= 0) {
        return {
          title: "Achat recommandé",
          message:
            "La demande est forte et le prix est stable (ou en baisse). Ça vaut le coup d’acheter, mais vérifie quand même le franco de port.",
        }
      }
      return {
        title: "Achat recommandé",
        message:
          "Bonne traction mais le prix grimpe. Tu peux acheter, en gardant un œil sur le franco de port.",
      }
    }
    if (interest >= 20) {
      if (strongIncrease) {
        return {
          title: "À surveiller",
          message:
            "Intérêt correct, mais la hausse est marquée. Je patienterais ou je comparerais davantage.",
        }
      }
      if (variation <= 0) {
        return {
          title: "À surveiller",
          message:
            "Intérêt correct et prix plutôt stable. Compare vite avec un ou deux fournisseurs avant de valider.",
        }
      }
      return {
        title: "À surveiller",
        message: "L’intérêt est correct, mais le prix monte. Je garderais la main sur le timing.",
      }
    }
    if (variation <= 0) {
      return {
        title: "Pas prioritaire",
        message: "Peu d’intérêt côté marché, même si le prix baisse. Pas urgent.",
      }
    }
    return {
      title: "Pas prioritaire",
      message: "Peu d’intérêt et prix en hausse : je laisserais passer pour l’instant.",
    }
  }, [selectedProductMetrics])
  const marketPostSortRows = useCallback((params: PostSortRowsParams<MarketGridRow>) => {
    const grouped = new Map<
      string,
      { group?: typeof params.nodes[number]; items: typeof params.nodes[number][] }
    >()
    const orderedSupplierIds: string[] = []
    const seenSuppliers = new Set<string>()

    params.nodes.forEach((node) => {
      const data = node.data
      if (!data) return
      const supplierId = data.supplierId
      const bucket =
        grouped.get(supplierId) ?? { items: [] }
      if (data.rowType === "group") {
        bucket.group = node
      } else {
        bucket.items.push(node)
        if (!seenSuppliers.has(supplierId)) {
          seenSuppliers.add(supplierId)
          orderedSupplierIds.push(supplierId)
        }
      }
      grouped.set(supplierId, bucket)
    })

    grouped.forEach((_value, supplierId) => {
      if (!seenSuppliers.has(supplierId)) {
        orderedSupplierIds.push(supplierId)
      }
    })

    const sortedNodes: typeof params.nodes = []
    orderedSupplierIds.forEach((supplierId) => {
      const bucket = grouped.get(supplierId)
      if (!bucket) return
      if (bucket.group) sortedNodes.push(bucket.group)
      sortedNodes.push(...bucket.items)
    })

    params.nodes.length = 0
    params.nodes.push(...sortedNodes)
  }, [])
  const setColumnVisibility = useCallback((columnId: string, visible: boolean) => {
    setHiddenColumnIds((prev) => {
      const next = new Set(prev)
      if (visible) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }, [])
  const resetColumnVisibility = useCallback(() => {
    setHiddenColumnIds(new Set())
  }, [])
  const openProductSheet = useCallback((productId: string) => {
    setSelectedProductId(productId)
    setIsProductSheetOpen(true)
  }, [])
  const handleProductSheetOpenChange = useCallback((open: boolean) => {
    setIsProductSheetOpen(open)
    if (!open) {
      setSelectedProductId(null)
    }
  }, [])
  const marketDefaultColDef = useMemo<ColDef<MarketGridRow>>(
    () => ({
      cellClass: "flex items-center",
      sortable: true,
    }),
    []
  )
  const applyHiddenColumn = useCallback(
    (colDef: ColDef<MarketGridRow>) => {
      if (!colDef.colId) return colDef
      return { ...colDef, hide: hiddenColumnIds.has(colDef.colId) }
    },
    [hiddenColumnIds]
  )
  const supplierColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Fournisseur / Produit",
      colId: "supplier",
      field: "supplierLabel",
      flex: 2.5,
      minWidth: 230,
      valueGetter: ({ data }) => {
        if (!data) return null
        return data.supplierLabel
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data) return null
        if (data.rowType === "group") {
          const isCollapsed = collapsedSuppliers.has(data.supplierId)
          return (
            <button
              type="button"
              onClick={() => toggleSupplierGroup(data.supplierId)}
              className="flex h-full w-full items-center gap-2 text-left text-sm text-foreground"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-base font-semibold text-foreground">
                {data.supplierLabel}
              </span>
            </button>
          )
        }
        return (
          <div className="flex h-full items-center pl-10 text-sm text-foreground">
            {data.productLabel}
          </div>
        )
      },
    }),
    [collapsedSuppliers, toggleSupplierGroup]
  )
  const volatilityColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Volatilité",
      colId: "volatility",
      flex: 1,
      minWidth: 160,
      valueGetter: ({ data }) => {
        if (!data || data.rowType !== "product") return null
        const volatility = getProductVolatility(data.productId)
        return volatility ? volatility.max - volatility.min : null
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        const volatility = getProductVolatility(data.productId)
        if (!volatility) {
          return <div className="flex h-full items-center text-sm text-foreground">—</div>
        }
        return (
          <div className="flex h-full items-center text-sm text-muted-foreground">
            {euroFormatter.format(volatility.min)} → {euroFormatter.format(volatility.max)}
          </div>
        )
      },
    }),
    [euroFormatter, getProductVolatility]
  )
  const avgPriceColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Prix moyen",
      colId: "avgPrice",
      flex: 1,
      minWidth: 140,
      valueGetter: ({ data }) => {
        if (!data || data.rowType !== "product") return null
        return getProductAverage(data.productId)
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        const avgValue = getProductAverage(data.productId)
        if (avgValue === null) {
          return <div className="flex h-full items-center text-sm text-foreground">—</div>
        }
          return (
            <div className="flex h-full items-center text-sm font-semibold text-foreground">
              {unitPriceFormatter.format(avgValue)}€
              <span className="ml-1 text-muted-foreground">/{data.unit}</span>
            </div>
          )
        },
      }),
    [getProductAverage, unitPriceFormatter]
  )
  const variationColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Variation",
      colId: "variation",
      flex: 1,
      minWidth: 80,
      valueGetter: ({ data }) => {
        if (!data || data.rowType !== "product") return null
        return getProductVariation(data.productId)
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        const variation = getProductVariation(data.productId)
        if (variation === null) {
          return <div className="flex h-full items-center text-sm text-foreground">—</div>
        }
        const sign = variation > 0 ? "+" : variation < 0 ? "-" : ""
        const formatted = `${sign}${Math.abs(variation).toFixed(1)}%`
        const toneClass =
          variation > 0
            ? "text-red-500"
            : variation < 0
              ? "text-green-500"
              : "text-muted-foreground"
        return <div className={cn("flex h-full items-center text-sm", toneClass)}>{formatted}</div>
      },
    }),
    [getProductVariation]
  )
  const lastPriceColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Dernier prix",
      colId: "lastPrice",
      flex: 1,
      minWidth: 150,
      valueGetter: ({ data }) => {
        if (!data || data.rowType !== "product") return null
        return getProductLastPrice(data.productId)
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        const lastPrice = getProductLastPrice(data.productId)
        if (lastPrice === null) {
          return <div className="flex h-full items-center text-sm text-foreground">—</div>
        }
        return (
          <div className="flex h-full items-center text-sm text-foreground">
            {unitPriceFormatter.format(lastPrice)}€
            <span className="ml-1 text-muted-foreground">/{data.unit}</span>
          </div>
        )
      },
    }),
    [getProductLastPrice, unitPriceFormatter]
  )
  const updatedAtColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Mise à jour",
      colId: "updatedAt",
      flex: 1,
      minWidth: 140,
      valueGetter: ({ data }) => {
        if (!data || data.rowType !== "product") return null
        return getProductLastDate(data.productId)?.getTime() ?? null
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        const lastUpdated = getProductLastUpdated(data.productId)
        if (!lastUpdated) {
          return <div className="flex h-full items-center text-sm text-foreground">—</div>
        }
        return (
          <div className="flex h-full items-center text-sm text-muted-foreground">
            {lastUpdated}
          </div>
        )
      },
    }),
    [getProductLastDate, getProductLastUpdated]
  )
  const interestColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Intérêt",
      colId: "interest",
      flex: 1,
      minWidth: 130,
      headerComponent: InterestHeader,
      valueGetter: ({ data }) => {
        if (!data || data.rowType !== "product") return null
        return getInterestPercent(data.productId)
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        const interest = getInterestPercent(data.productId)
        if (interest === null) {
          return <div className="flex h-full items-center text-sm text-foreground">—</div>
        }
        const tone = getInterestTone(interest)
        const Icon = tone.icon
        return (
          <div className={cn("flex h-full items-center gap-2 text-sm font-medium", tone.className)}>
            <span>{interest}%</span>
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        )
      },
    }),
    [getInterestPercent, getInterestTone]
  )
  const recommendationColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "Recommandations",
      colId: "recommendation",
      flex: 1,
      minWidth: 160,
      valueGetter: ({ data }) => {
        if (!data || data.rowType !== "product") return null
        const badge = getRecommendationBadge(data.productId)
        return badge ? RECOMMENDATION_RANK[badge] ?? 0 : null
      },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        const badge = getRecommendationBadge(data.productId)
        if (!badge) {
          return <div className="flex h-full items-center text-sm text-foreground">—</div>
        }
        const badgeTone =
          badge === "Bon prix"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            : badge === "Très demandé"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
              : badge === "À surveiller"
                ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                : badge === "Prix instable"
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                  : badge === "Intérêt faible"
                    ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
                    : badge === "Données anciennes"
                      ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
        return (
          <div className="flex h-full items-center">
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                badgeTone
              )}
            >
              {badge}
            </span>
          </div>
        )
      },
    }),
    [getRecommendationBadge]
  )
  const actionColumn = useMemo<ColDef<MarketGridRow>>(
    () => ({
      headerName: "-",
      colId: "actions",
      width: 56,
      maxWidth: 56,
      headerClass:
        "justify-center px-0 [&_.ag-header-cell-label]:!justify-center [&_.ag-header-cell-label]:!overflow-visible",
      sortable: false,
      filter: false,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true,
      suppressHeaderContextMenu: true,
      resizable: false,
      cellClass:
        "flex items-center justify-center px-0 [&_.ag-cell-value]:!flex [&_.ag-cell-value]:!w-full [&_.ag-cell-value]:!justify-center [&_.ag-cell-value]:!overflow-visible [&_.ag-cell-value]:!text-clip",
      cellStyle: { paddingLeft: 0, paddingRight: 0 },
      cellRenderer: ({ data }: { data?: MarketGridRow }) => {
        if (!data || data.rowType !== "product") return null
        return (
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Ajouter ${data.productLabel}`}
            onClick={() => openProductSheet(data.productId)}
          >
            <Plus className="h-4 w-4" />
          </button>
        )
      },
    }),
    [openProductSheet]
  )
  const marketGridColumnDefsCompact = useMemo<ColDef<MarketGridRow>[]>(
    () => [
      supplierColumn,
      avgPriceColumn,
      variationColumn,
      lastPriceColumn,
      updatedAtColumn,
      interestColumn,
    ],
    [
      supplierColumn,
      avgPriceColumn,
      variationColumn,
      lastPriceColumn,
      updatedAtColumn,
      interestColumn,
    ]
  )
  const marketGridColumnDefsFull = useMemo<ColDef<MarketGridRow>[]>(
    () => [
      supplierColumn,
      applyHiddenColumn(volatilityColumn),
      applyHiddenColumn(avgPriceColumn),
      applyHiddenColumn(variationColumn),
      applyHiddenColumn(lastPriceColumn),
      applyHiddenColumn(updatedAtColumn),
      applyHiddenColumn(interestColumn),
      applyHiddenColumn(recommendationColumn),
      actionColumn,
    ],
    [
      applyHiddenColumn,
      supplierColumn,
      volatilityColumn,
      avgPriceColumn,
      variationColumn,
      lastPriceColumn,
      updatedAtColumn,
      interestColumn,
      recommendationColumn,
      actionColumn,
    ]
  )
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Prix du marché</h1>
          <p className="text-sm text-muted-foreground">
            Comparez vos achats aux prix pratiqués sur le marché.
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Info className="h-4 w-4" />
          Comprendre les prix du marché
        </Button>
      </div>
      <MarketComparatorCard
        comparisonRange={comparisonRange}
        onRangeChange={setComparisonRange}
        comparisonInterval={comparisonInterval}
        onIntervalChange={setComparisonInterval}
        supplierOptions={supplierOptions}
        productOptions={productOptions}
        leftSupplierId={leftSupplierId}
        leftProductId={leftProductId}
        rightSupplierId={rightSupplierId}
        rightProductId={rightProductId}
        onLeftSupplierChange={setLeftSupplierId}
        onLeftProductChange={setLeftProductId}
        onRightSupplierChange={setRightSupplierId}
        onRightProductChange={setRightProductId}
        leftProductLabel={leftProductLabel}
        rightProductLabel={rightProductLabel}
        hasLeftSelection={hasLeftSelection}
        hasRightSelection={hasRightSelection}
        hasChartValues={hasChartValues}
        comparisonChartData={comparisonChartData}
        comparisonChartConfig={comparisonChartConfig}
        leftStats={leftStats}
        rightStats={rightStats}
        euroFormatter={euroFormatter}
        consultantMessage={consultantMessage}
        consultantAvatarSrc={ConsultantAvatar}
        formatTooltipDate={formatTooltipDate}
      />
      <MarketDatabaseCard
        supplierFilterOptions={supplierFilterOptions}
        selectedSuppliers={selectedSuppliers}
        onSuppliersChange={setSelectedSuppliers}
        productSearch={productSearch}
        onProductSearchChange={setProductSearch}
        marketStatus={marketStatus}
        agThemeMode={agThemeMode}
        marketGridRows={marketGridRows}
        marketGridColumnDefsCompact={marketGridColumnDefsCompact}
        marketGridColumnDefsFull={marketGridColumnDefsFull}
        marketDefaultColDef={marketDefaultColDef}
        marketGetRowId={marketGetRowId}
        marketGetRowClass={marketGetRowClass}
        marketRowHeight={marketRowHeight}
        marketPostSortRows={marketPostSortRows}
        hiddenColumnIds={hiddenColumnIds}
        onToggleColumn={setColumnVisibility}
        onResetColumns={resetColumnVisibility}
        columnOptions={FULL_COLUMN_OPTIONS}
      />
      <MarketProductSheet
        open={isProductSheetOpen}
        onOpenChange={handleProductSheetOpenChange}
        selectedProduct={selectedProduct}
        selectedProductMetrics={selectedProductMetrics}
        unitPriceFormatter={unitPriceFormatter}
        euroFormatter={euroFormatter}
        consultantNote={consultantNote}
        consultantAvatarSrc={ConsultantAvatar}
        getInterestTone={getInterestTone}
      />
    </div>
  )
}
