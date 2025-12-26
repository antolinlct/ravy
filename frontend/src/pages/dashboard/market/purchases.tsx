import { useCallback, useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type { ColDef, GetRowIdParams, RowHeightParams } from "ag-grid-community"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { Check, ChevronDown, ChevronRight, ChevronsUpDown, Info } from "lucide-react"

import ConsultantAvatar from "@/assets/avatar.png"
import { useTheme } from "@/components/dark/theme-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import type { IntervalKey } from "@/components/blocks/area-chart"
import { cn } from "@/lib/utils"

ModuleRegistry.registerModules([AllCommunityModule])

type PricePoint = {
  date: string
  value: number
}

type MarketGroupRow = {
  id: string
  rowType: "group"
  supplierId: string
  supplierLabel: string
  productCount: number
}

type MarketProductRow = {
  id: string
  rowType: "product"
  productId: string
  supplierId: string
  supplierLabel: string
  productLabel: string
  unit: string
}

type MarketGridRow = MarketGroupRow | MarketProductRow

const supplierOptions = [
  { id: "sysco", label: "Sysco France", usedByUser: true },
  { id: "episaveurs", label: "EpiSaveurs groupe pomona", usedByUser: false },
  { id: "metro", label: "Metro", usedByUser: true },
  { id: "brake", label: "Brake", usedByUser: true },
  { id: "dc-plateforme", label: "DC PLATEFORME", usedByUser: true },
  { id: "transgourmet", label: "Transgourmet", usedByUser: false },
  { id: "pro-a-pro", label: "Pro à Pro", usedByUser: false },
  { id: "biogroupe", label: "Biogroupe", usedByUser: false },
]

const supplierLabelById = supplierOptions.reduce<Record<string, string>>((acc, supplier) => {
  acc[supplier.id] = supplier.label
  return acc
}, {})

const productOptions = [
  { id: "sesame-oil", label: "HUILE SESAME BI50CL X6", supplierId: "sysco", unit: "L" },
  {
    id: "colza-oil",
    label: "Huile colza raffinée bid 5Lx3",
    supplierId: "episaveurs",
    unit: "L",
  },
  { id: "olive-oil", label: "Huile d'olive 5L", supplierId: "metro", unit: "L" },
  { id: "sugar-5kg", label: "Sucre 5kg", supplierId: "transgourmet", unit: "kg" },
  { id: "butter-250", label: "Beurre AOP 250g", supplierId: "brake", unit: "kg" },
  {
    id: "tomato-box",
    label: "Tomate concassée 2/1",
    supplierId: "dc-plateforme",
    unit: "kg",
  },
  { id: "pasta-penne", label: "Penne rigate 5kg", supplierId: "pro-a-pro", unit: "kg" },
  {
    id: "mozzarella",
    label: "Mozzarella 18%MG min.",
    supplierId: "biogroupe",
    unit: "kg",
  },
]

const marketProductRows: MarketProductRow[] = productOptions.map((product) => ({
  id: `product-${product.id}`,
  rowType: "product",
  productId: product.id,
  supplierId: product.supplierId,
  supplierLabel: supplierLabelById[product.supplierId] ?? product.supplierId,
  productLabel: product.label,
  unit: product.unit,
}))

const priceSeriesByProduct: Record<string, PricePoint[]> = {
  "sesame-oil": [
    { date: "2025-01-14", value: 10.6 },
    { date: "2025-02-25", value: 11.8 },
    { date: "2025-03-25", value: 12.4 },
    { date: "2025-05-27", value: 11.1 },
    { date: "2025-06-19", value: 12.9 },
  ],
  "colza-oil": [
    { date: "2025-01-05", value: 9.9 },
    { date: "2025-02-14", value: 9.1 },
    { date: "2025-03-19", value: 8.6 },
    { date: "2025-04-26", value: 7.4 },
    { date: "2025-05-16", value: 8.1 },
    { date: "2025-06-28", value: 7.2 },
  ],
  "olive-oil": [
    { date: "2025-01-06", value: 12.4 },
    { date: "2025-02-12", value: 12.1 },
    { date: "2025-03-19", value: 11.9 },
    { date: "2025-04-21", value: 11.7 },
    { date: "2025-05-22", value: 11.6 },
  ],
  "sugar-5kg": [
    { date: "2025-01-04", value: 6.2 },
    { date: "2025-02-18", value: 6.0 },
    { date: "2025-03-20", value: 6.3 },
    { date: "2025-04-25", value: 6.1 },
    { date: "2025-05-28", value: 6.0 },
  ],
  "butter-250": [
    { date: "2025-01-10", value: 2.7 },
    { date: "2025-02-14", value: 3.8 },
    { date: "2025-03-20", value: 1.9 },
    { date: "2025-04-24", value: 3.8 },
    { date: "2025-05-29", value: 7.75 },
  ],
  "tomato-box": [
    { date: "2025-01-08", value: 4.5 },
    { date: "2025-02-20", value: 4.4 },
    { date: "2025-03-18", value: 4.35 },
    { date: "2025-04-23", value: 4.5 },
    { date: "2025-05-27", value: 4.55 },
  ],
  "pasta-penne": [
    { date: "2025-01-09", value: 2.4 },
    { date: "2025-02-11", value: 2.35 },
    { date: "2025-03-17", value: 2.3 },
    { date: "2025-04-22", value: 2.38 },
    { date: "2025-05-30", value: 2.42 },
  ],
  mozzarella: [
    { date: "2025-01-13", value: 7.9 },
    { date: "2025-02-15", value: 8.1 },
    { date: "2025-03-21", value: 8.0 },
    { date: "2025-04-20", value: 7.8 },
    { date: "2025-05-24", value: 7.9 },
  ],
}

const productUsageById: Record<string, { monthlyQty: number }> = {
  "sesame-oil": { monthlyQty: 120 },
  "colza-oil": { monthlyQty: 140 },
  "olive-oil": { monthlyQty: 90 },
  "sugar-5kg": { monthlyQty: 45 },
  "butter-250": { monthlyQty: 260 },
  "tomato-box": { monthlyQty: 75 },
  "pasta-penne": { monthlyQty: 110 },
  mozzarella: { monthlyQty: 95 },
}

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
  const { theme = "system" } = useTheme()
  const [comparisonRange, setComparisonRange] = useState<{ start?: Date; end?: Date }>(() => {
    const end = new Date()
    const start = new Date(end)
    start.setMonth(start.getMonth() - 3)
    return { start, end }
  })
  const [comparisonInterval, setComparisonInterval] = useState<IntervalKey>("month")
  const [leftSupplierOpen, setLeftSupplierOpen] = useState(false)
  const [leftProductOpen, setLeftProductOpen] = useState(false)
  const [leftSupplierId, setLeftSupplierId] = useState("")
  const [leftProductId, setLeftProductId] = useState("")
  const [leftInvoicesOnly, setLeftInvoicesOnly] = useState(false)
  const [rightSupplierOpen, setRightSupplierOpen] = useState(false)
  const [rightProductOpen, setRightProductOpen] = useState(false)
  const [rightSupplierId, setRightSupplierId] = useState("")
  const [rightProductId, setRightProductId] = useState("")
  const [rightInvoicesOnly, setRightInvoicesOnly] = useState(false)
  const leftProducts = useMemo(
    () => productOptions.filter((product) => product.supplierId === leftSupplierId),
    [leftSupplierId]
  )
  const rightProducts = useMemo(
    () => productOptions.filter((product) => product.supplierId === rightSupplierId),
    [rightSupplierId]
  )
  const rightSupplierUsed = useMemo(
    () => supplierOptions.find((supplier) => supplier.id === rightSupplierId)?.usedByUser ?? false,
    [rightSupplierId]
  )
  const leftProductLabel = useMemo(
    () => productOptions.find((product) => product.id === leftProductId)?.label ?? "Produit 1",
    [leftProductId]
  )
  const rightProductLabel = useMemo(
    () => productOptions.find((product) => product.id === rightProductId)?.label ?? "Produit 2",
    [rightProductId]
  )
  const monthlyQuantity = useMemo(() => {
    return (
      (leftProductId && productUsageById[leftProductId]?.monthlyQty) ||
      (rightProductId && productUsageById[rightProductId]?.monthlyQty) ||
      null
    )
  }, [leftProductId, rightProductId])
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
  }, [comparisonInterval, comparisonRange.end, comparisonRange.start, leftProductId, rightProductId])
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
    const productsBySupplier = new Map<string, MarketProductRow[]>()
    marketProductRows.forEach((product) => {
      const bucket = productsBySupplier.get(product.supplierId)
      if (bucket) {
        bucket.push(product)
      } else {
        productsBySupplier.set(product.supplierId, [product])
      }
    })
    const rows: MarketGridRow[] = []
    supplierOptions.forEach((supplier) => {
      const products = productsBySupplier.get(supplier.id) ?? []
      rows.push({
        id: `group-${supplier.id}`,
        rowType: "group",
        supplierId: supplier.id,
        supplierLabel: supplier.label,
        productCount: products.length,
      })
      if (!collapsedSuppliers.has(supplier.id)) {
        products.forEach((product, index) => {
          rows.push({
            ...product,
            id: `product-${supplier.id}-${index}`,
          })
        })
      }
    })
    return rows
  }, [collapsedSuppliers, marketProductRows, supplierOptions])
  const marketGetRowId = useCallback((params: GetRowIdParams<MarketGridRow>) => {
    return params.data?.id ?? ""
  }, [])
  const marketRowHeight = useCallback((params: RowHeightParams<MarketGridRow>) => {
    if (params.data?.rowType === "group") return 40
    return 52
  }, [])
  const getProductVolatility = useCallback(
    (productId: string) => {
      const points = priceSeriesByProduct[productId] ?? []
      let minValue: number | null = null
      let maxValue: number | null = null
      points.forEach((point) => {
        if (minValue === null || point.value < minValue) minValue = point.value
        if (maxValue === null || point.value > maxValue) maxValue = point.value
      })
      if (minValue === null || maxValue === null) return null
      return { min: minValue, max: maxValue }
    },
    []
  )
  const getProductAverage = useCallback((productId: string) => {
    const points = priceSeriesByProduct[productId] ?? []
    if (!points.length) return null
    const total = points.reduce((sum, point) => sum + point.value, 0)
    return total / points.length
  }, [])
  const getProductVariation = useCallback((productId: string) => {
    const points = priceSeriesByProduct[productId] ?? []
    if (points.length < 2) return null
    const first = points[0]?.value ?? null
    const last = points[points.length - 1]?.value ?? null
    if (first === null || last === null || first === 0) return null
    return ((last - first) / first) * 100
  }, [])
  const getProductLastPrice = useCallback((productId: string) => {
    const points = priceSeriesByProduct[productId] ?? []
    if (!points.length) return null
    return points[points.length - 1]?.value ?? null
  }, [])
  const marketDefaultColDef = useMemo<ColDef<MarketGridRow>>(
    () => ({
      cellClass: "flex items-center",
    }),
    []
  )
  const marketGridColumnDefs = useMemo<ColDef<MarketGridRow>[]>(
    () => [
      {
        headerName: "Fournisseur / Produit",
        field: "supplierLabel",
        flex: 1,
        minWidth: 260,
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
                <span className="font-semibold">{data.supplierLabel}</span>
              </button>
            )
          }
          return (
            <div className="flex h-full items-center pl-10 text-sm text-foreground">
              {data.productLabel}
            </div>
          )
        },
      },
      {
        headerName: "Volatilité",
        colId: "volatility",
        flex: 1,
        minWidth: 220,
        cellRenderer: ({ data }: { data?: MarketGridRow }) => {
          if (!data || data.rowType !== "product") return null
          const volatility = getProductVolatility(data.productId)
          if (!volatility) {
            return <div className="flex h-full items-center text-sm text-foreground">—</div>
          }
          return (
            <div className="flex h-full items-center text-sm text-foreground">
              {euroFormatter.format(volatility.min)} → {euroFormatter.format(volatility.max)}
            </div>
          )
        },
      },
      {
        headerName: "Prix moyen",
        colId: "avgPrice",
        flex: 1,
        minWidth: 200,
        cellRenderer: ({ data }: { data?: MarketGridRow }) => {
          if (!data || data.rowType !== "product") return null
          const avgValue = getProductAverage(data.productId)
          if (avgValue === null) {
            return <div className="flex h-full items-center text-sm text-foreground">—</div>
          }
          return (
            <div className="flex h-full items-center text-sm text-foreground">
              {unitPriceFormatter.format(avgValue)}€/{data.unit}
            </div>
          )
        },
      },
      {
        headerName: "Variation",
        colId: "variation",
        flex: 1,
        minWidth: 160,
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
              ? "text-emerald-500"
              : variation < 0
                ? "text-rose-500"
                : "text-muted-foreground"
          return (
            <div className={cn("flex h-full items-center text-sm", toneClass)}>
              {formatted}
            </div>
          )
        },
      },
      {
        headerName: "Dernier prix",
        colId: "lastPrice",
        flex: 1,
        minWidth: 200,
        cellRenderer: ({ data }: { data?: MarketGridRow }) => {
          if (!data || data.rowType !== "product") return null
          const lastPrice = getProductLastPrice(data.productId)
          if (lastPrice === null) {
            return <div className="flex h-full items-center text-sm text-foreground">—</div>
          }
          return (
            <div className="flex h-full items-center text-sm text-foreground">
              {unitPriceFormatter.format(lastPrice)}€/{data.unit}
            </div>
          )
        },
      },
    ],
    [
      collapsedSuppliers,
      euroFormatter,
      getProductAverage,
      getProductLastPrice,
      getProductVolatility,
      getProductVariation,
      toggleSupplierGroup,
      unitPriceFormatter,
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
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <CardTitle>Comparateur du marché</CardTitle>
            <p className="text-sm text-muted-foreground">
              Analysez vos prix d&apos;achat face aux références du marché.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <DoubleDatePicker
              displayFormat="long"
              showSeparator
              showStartLabel={false}
              showEndLabel={false}
              className="sm:items-center"
              startButtonClassName="w-[160px]"
              endButtonClassName="w-[160px]"
              startDate={comparisonRange.start}
              endDate={comparisonRange.end}
              onChange={({ startDate, endDate }) =>
                setComparisonRange({ start: startDate, end: endDate })
              }
            />
            <div className="flex items-center">
              <Tabs
                value={comparisonInterval}
                onValueChange={(value) => setComparisonInterval(value as IntervalKey)}
              >
                <TabsList>
                  <TabsTrigger value="day" className="text-sm data-[state=inactive]:font-normal">
                    Jour
                  </TabsTrigger>
                  <TabsTrigger value="week" className="text-sm data-[state=inactive]:font-normal">
                    Semaine
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-sm data-[state=inactive]:font-normal">
                    Mois
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-[color:var(--chart-1)]">Produit 1</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={leftInvoicesOnly}
                      onCheckedChange={(checked) => setLeftInvoicesOnly(checked === true)}
                      aria-label="Uniquement mes factures"
                      className="data-[state=checked]:bg-[#108FFF] data-[state=checked]:border-[#108FFF]"
                    />
                    <span className="text-sm text-muted-foreground">Uniquement mes factures</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
                    <Popover open={leftSupplierOpen} onOpenChange={setLeftSupplierOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={leftSupplierOpen}
                          className="w-full justify-between"
                        >
                          {leftSupplierId
                            ? supplierOptions.find((opt) => opt.id === leftSupplierId)?.label
                            : "Sélectionnez un fournisseur"}
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Aucun fournisseur.</CommandEmpty>
                            <CommandGroup>
                              {supplierOptions.map((opt) => (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.id}
                                  onSelect={(value) => {
                                    const next = value === leftSupplierId ? "" : value
                                    setLeftSupplierId(next)
                                    setLeftProductId("")
                                    setLeftSupplierOpen(false)
                                    setLeftProductOpen(false)
                                  }}
                                >
                                  {opt.label}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      leftSupplierId === opt.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Produit</Label>
                    <Popover open={leftProductOpen} onOpenChange={setLeftProductOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={leftProductOpen}
                          className="w-full justify-between"
                          disabled={!leftSupplierId}
                        >
                          {leftProductId
                            ? leftProducts.find((opt) => opt.id === leftProductId)?.label
                            : leftSupplierId
                              ? "Sélectionnez un produit"
                              : "Choisissez un fournisseur"}
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un produit..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                            <CommandGroup>
                              {leftProducts.map((opt) => (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.id}
                                  onSelect={(value) => {
                                    const next = value === leftProductId ? "" : value
                                    setLeftProductId(next)
                                    setLeftProductOpen(false)
                                  }}
                                >
                                  {opt.label}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      leftProductId === opt.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-[color:var(--chart-5)]">Produit 2</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={rightInvoicesOnly}
                      onCheckedChange={(checked) => setRightInvoicesOnly(checked === true)}
                      aria-label="Uniquement mes factures"
                      className="data-[state=checked]:bg-[#108FFF] data-[state=checked]:border-[#108FFF]"
                    />
                    <span className="text-sm text-muted-foreground">Uniquement mes factures</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
                    <Popover open={rightSupplierOpen} onOpenChange={setRightSupplierOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={rightSupplierOpen}
                          className="w-full justify-between"
                        >
                          {rightSupplierId
                            ? supplierOptions.find((opt) => opt.id === rightSupplierId)?.label
                            : "Sélectionnez un fournisseur"}
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Aucun fournisseur.</CommandEmpty>
                            <CommandGroup>
                              {supplierOptions.map((opt) => (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.id}
                                  onSelect={(value) => {
                                    const next = value === rightSupplierId ? "" : value
                                    setRightSupplierId(next)
                                    setRightProductId("")
                                    setRightSupplierOpen(false)
                                    setRightProductOpen(false)
                                  }}
                                >
                                  {opt.label}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      rightSupplierId === opt.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Produit</Label>
                    <Popover open={rightProductOpen} onOpenChange={setRightProductOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={rightProductOpen}
                          className="w-full justify-between"
                          disabled={!rightSupplierId}
                        >
                          {rightProductId
                            ? rightProducts.find((opt) => opt.id === rightProductId)?.label
                            : rightSupplierId
                              ? "Sélectionnez un produit"
                              : "Choisissez un fournisseur"}
                          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Rechercher un produit..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>Aucun produit disponible.</CommandEmpty>
                            <CommandGroup>
                              {rightProducts.map((opt) => (
                                <CommandItem
                                  key={opt.id}
                                  value={opt.id}
                                  onSelect={(value) => {
                                    const next = value === rightProductId ? "" : value
                                    setRightProductId(next)
                                    setRightProductOpen(false)
                                  }}
                                >
                                  {opt.label}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      rightProductId === opt.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            {hasLeftSelection || hasRightSelection ? (
              hasChartValues ? (
                <ChartContainer
                  config={comparisonChartConfig}
                  className="h-[260px] w-full"
                >
                  <RechartsAreaChart data={comparisonChartData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={72}
                      tickFormatter={(value) => euroFormatter.format(value as number)}
                    />
                    <ChartTooltip
                      cursor={{ strokeDasharray: "4 4" }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const point = payload[0]?.payload as
                          | { date?: Date; left?: number | null; right?: number | null }
                          | undefined
                        const date = point?.date
                        return (
                          <div className="min-w-[12rem] rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
                            {date ? (
                              <div className="text-sm text-muted-foreground">
                                {formatTooltipDate(date)}
                              </div>
                            ) : null}
                            <div className="my-2 h-px bg-border/60" />
                            <div className="space-y-1">
                              {hasLeftSelection ? (
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="inline-block h-2 w-2 rounded-sm"
                                      style={{ backgroundColor: "var(--color-left)" }}
                                    />
                                    <span className="text-muted-foreground">{leftProductLabel}</span>
                                  </div>
                                  <span className="font-medium">
                                    {point?.left !== undefined && point?.left !== null
                                      ? euroFormatter.format(point.left)
                                      : "—"}
                                  </span>
                                </div>
                              ) : null}
                              {hasRightSelection ? (
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="inline-block h-2 w-2 rounded-sm"
                                      style={{ backgroundColor: "var(--color-right)" }}
                                    />
                                    <span className="text-muted-foreground">{rightProductLabel}</span>
                                  </div>
                                  <span className="font-medium">
                                    {point?.right !== undefined && point?.right !== null
                                      ? euroFormatter.format(point.right)
                                      : "—"}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )
                      }}
                    />
                    {hasLeftSelection ? (
                      <Area
                        type="monotone"
                        dataKey="left"
                        yAxisId="left"
                        stroke="var(--color-left)"
                        fill="var(--color-left)"
                        fillOpacity={0.16}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    ) : null}
                    {hasRightSelection ? (
                      <Area
                        type="monotone"
                        dataKey="right"
                        yAxisId="left"
                        stroke="var(--color-right)"
                        fill="var(--color-right)"
                        fillOpacity={0.16}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    ) : null}
                  </RechartsAreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée disponible sur cette période.
                </div>
              )
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Sélectionnez un produit pour comparer.
              </div>
            )}
          </div>
          <Card className="rounded-md border-0 bg-transparent shadow-none">
            <CardContent className="space-y-4 p-0">
              {hasLeftSelection || hasRightSelection ? (
                <div
                  className={cn(
                    "grid gap-4",
                    hasLeftSelection && hasRightSelection ? "lg:grid-cols-2" : "grid-cols-1"
                  )}
                >
                  {hasLeftSelection ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span
                          className="h-2 w-2 rounded-sm"
                          style={{ backgroundColor: "var(--chart-1)" }}
                        />
                        {leftProductLabel}
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Volatilité</div>
                            <div className="text-sm font-medium">
                              {leftStats
                                ? `${euroFormatter.format(leftStats.min)} → ${euroFormatter.format(leftStats.max)}`
                                : "—"}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Prix d&apos;achat moyen
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm font-medium">
                              {leftStats ? euroFormatter.format(leftStats.avg) : "—"}
                              {leftStats ? (
                                <span className="text-xs text-muted-foreground">/u</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Dernier prix</div>
                            <div className="text-sm font-medium">
                              {leftStats?.last !== null && leftStats?.last !== undefined
                                ? euroFormatter.format(leftStats.last)
                                : "—"}
                              {leftStats ? (
                                <span className="ml-1 text-xs text-muted-foreground">/u</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {hasRightSelection ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span
                          className="h-2 w-2 rounded-sm"
                          style={{ backgroundColor: "var(--chart-5)" }}
                        />
                        {rightProductLabel}
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Volatilité</div>
                            <div className="text-sm font-medium">
                              {rightStats
                                ? `${euroFormatter.format(rightStats.min)} → ${euroFormatter.format(rightStats.max)}`
                                : "—"}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              Prix d&apos;achat moyen
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm font-medium">
                              {rightStats ? euroFormatter.format(rightStats.avg) : "—"}
                              {rightStats ? (
                                <span className="text-xs text-muted-foreground">/u</span>
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Dernier prix</div>
                            <div className="text-sm font-medium">
                              {rightStats?.last !== null && rightStats?.last !== undefined
                                ? euroFormatter.format(rightStats.last)
                                : "—"}
                              {rightStats ? (
                                <span className="ml-1 text-xs text-muted-foreground">/u</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Sélectionnez des produits pour afficher les indicateurs.
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={ConsultantAvatar} alt="Consultant" className="bg-transparent" />
                  </Avatar>
                </div>
                <p className="flex-1 text-sm text-foreground leading-relaxed">{consultantMessage}</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Base de données</CardTitle>
          <p className="text-sm text-muted-foreground">
            Partagez et consultez des prix de marché pour comparer vos achats aux références
            collectives.
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ height: 320, width: "100%" }} data-ag-theme-mode={agThemeMode}>
            <AgGridReact<MarketGridRow>
              rowData={marketGridRows}
              columnDefs={marketGridColumnDefs}
              defaultColDef={marketDefaultColDef}
              theme={themeQuartz}
              getRowId={marketGetRowId}
              getRowHeight={marketRowHeight}
              domLayout="normal"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
