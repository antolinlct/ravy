import { useCallback, useEffect, useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type {
  ColDef,
  GetRowIdParams,
  IHeaderParams,
  PostSortRowsParams,
  RowClassParams,
  RowHeightParams,
} from "ag-grid-community"
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Expand,
  Flame,
  Info,
  Plus,
  Rocket,
  Search,
  Shrink,
  Skull,
} from "lucide-react"

import ConsultantAvatar from "@/assets/avatar.png"
import { useTheme } from "@/components/dark/theme-provider"
import { Badge } from "@/components/ui/badge"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import { Input } from "@/components/ui/input"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import type { IntervalKey } from "@/components/blocks/area-chart"
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
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
  "Bon prix": 6,
  "Très demandé": 5,
  "Dans la moyenne": 4,
  "Intérêt faible": 3,
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
const maxProductMonthlyQty = Math.max(
  1,
  ...Object.values(productUsageById).map((usage) => usage.monthlyQty)
)

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
  const { theme = "system" } = useTheme()
  const [isGridFullscreen, setIsGridFullscreen] = useState(false)
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
  const supplierFilterOptions = useMemo(
    () => supplierOptions.map((supplier) => ({ value: supplier.id, label: supplier.label })),
    []
  )
  const normalizedProductQuery = useMemo(() => {
    const normalized = normalizeSearchValue(productSearch).trim()
    return normalized.length ? normalized.split(/\s+/).filter(Boolean) : []
  }, [productSearch])
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
        products.forEach((product, index) => {
          rows.push({
            ...product,
            id: `product-${supplier.id}-${index}`,
          })
        })
      }
    })
    return rows
  }, [collapsedSuppliers, marketProductRows, normalizedProductQuery, selectedSuppliers])
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
  const getProductLastDate = useCallback((productId: string): Date | null => {
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
  }, [])
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
      const lastDate = getProductLastDate(productId)
      if (!lastDate) return null
      const diffMs = Date.now() - lastDate.getTime()
      if (diffMs < 0) return null
      return Math.floor(diffMs / (1000 * 60 * 60 * 24))
    },
    [getProductLastDate]
  )
  const getMockUserVsMarketPercent = useCallback(
    (productId: string) => {
      const avg = getProductAverage(productId)
      if (!avg || avg === 0) return null
      const hash = productId.split("").reduce((total, char) => total + char.charCodeAt(0), 0)
      const offset = (hash % 17) - 8
      return offset
    },
    [getProductAverage]
  )
  const getMarketVolatilityIndex = useCallback(
    (productId: string) => {
      const avg = getProductAverage(productId)
      const volatility = getProductVolatility(productId)
      if (!avg || !volatility) return null
      return (volatility.max - volatility.min) / avg
    },
    [getProductAverage, getProductVolatility]
  )
  const getInterestPercent = useCallback(
    (productId: string) => {
      const monthlyQty = productUsageById[productId]?.monthlyQty
      if (!monthlyQty) return null
      return Math.round((monthlyQty / maxProductMonthlyQty) * 100)
    },
    []
  )
  const getInterestTone = useCallback((interest: number) => {
    if (interest >= 50) return { icon: Rocket, className: "text-green-500" }
    if (interest >= 20) return { icon: Flame, className: "text-orange-500" }
    return { icon: Skull, className: "text-red-500" }
  }, [])
  const getRecommendationBadge = useCallback(
    (productId: string) => {
      const userVsPct = getMockUserVsMarketPercent(productId)
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
      getMockUserVsMarketPercent,
    ]
  )
  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null
    return marketProductRows.find((product) => product.productId === selectedProductId) ?? null
  }, [selectedProductId])
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
      suppressMenu: true,
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
    [getProductLastUpdated]
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
      suppressMenu: true,
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
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Base de données</CardTitle>
            <p className="text-sm text-muted-foreground">
              Consultez les prix du marché payé par vos concurrents.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <MultipleCombobox
              className="max-w-xs"
              placeholder="Sélectionner des fournisseurs"
              items={supplierFilterOptions}
              value={selectedSuppliers}
              onChange={setSelectedSuppliers}
            />
            <div className="relative w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Rechercher un produit"
                className="w-full pl-9"
              />
            </div>
            <Button
              variant="secondary"
              size="icon"
              type="button"
              onClick={() => setIsGridFullscreen(true)}
              className="self-start"
              aria-label="Agrandir le tableau"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: 620, width: "100%" }} data-ag-theme-mode={agThemeMode}>
            <AgGridReact<MarketGridRow>
              rowData={marketGridRows}
              columnDefs={marketGridColumnDefsCompact}
              defaultColDef={marketDefaultColDef}
              theme={themeQuartz}
              suppressDragLeaveHidesColumns
              getRowId={marketGetRowId}
              getRowClass={marketGetRowClass}
              getRowHeight={marketRowHeight}
              postSortRows={marketPostSortRows}
              domLayout="normal"
            />
          </div>
        </CardContent>
      </Card>
      <Dialog open={isGridFullscreen} onOpenChange={setIsGridFullscreen}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 h-[100svh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-6 sm:max-w-none"
        >
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Base de données</h2>
                <p className="text-sm text-muted-foreground">
                  Consultez les prix du marché payé par vos concurrents.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <MultipleCombobox
                  className="max-w-xs"
                  placeholder="Sélectionner des fournisseurs"
                  items={supplierFilterOptions}
                  value={selectedSuppliers}
                  onChange={setSelectedSuppliers}
                />
                <div className="relative w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Rechercher un produit"
                    className="w-full pl-9"
                  />
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" type="button">
                      Colonnes
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 space-y-2">
                    <div className="space-y-2">
                      {FULL_COLUMN_OPTIONS.map((column) => {
                        const isVisible = !hiddenColumnIds.has(column.id)
                        return (
                          <label
                            key={column.id}
                            className="flex items-center gap-2 text-sm text-foreground"
                          >
                            <Checkbox
                              checked={isVisible}
                              onCheckedChange={(checked) =>
                                setColumnVisibility(column.id, checked === true)
                              }
                              aria-label={`Afficher la colonne ${column.label}`}
                            />
                            <span>{column.label}</span>
                          </label>
                        )
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="w-full justify-center"
                      onClick={resetColumnVisibility}
                    >
                      Réinitialiser
                    </Button>
                  </PopoverContent>
                </Popover>
                <DialogClose asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    type="button"
                    aria-label="Réduire le tableau"
                  >
                    <Shrink className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
            <div className="flex-1" data-ag-theme-mode={agThemeMode}>
              <div style={{ height: "100%", width: "100%" }}>
                <AgGridReact<MarketGridRow>
                  rowData={marketGridRows}
                  columnDefs={marketGridColumnDefsFull}
                  defaultColDef={marketDefaultColDef}
                  theme={themeQuartz}
                  suppressDragLeaveHidesColumns
                  getRowId={marketGetRowId}
                  getRowClass={marketGetRowClass}
                  getRowHeight={marketRowHeight}
                  postSortRows={marketPostSortRows}
                  domLayout="normal"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Sheet open={isProductSheetOpen} onOpenChange={handleProductSheetOpenChange}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedProduct?.productLabel ?? "Détail du produit"}</SheetTitle>
            <SheetDescription>
              {selectedProduct
                ? selectedProduct.supplierLabel
                : "Sélectionnez un produit pour afficher les détails."}
            </SheetDescription>
          </SheetHeader>
          {selectedProduct ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Volatilité</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedProductMetrics?.volatility
                      ? `${euroFormatter.format(
                          selectedProductMetrics.volatility.min
                        )} → ${euroFormatter.format(selectedProductMetrics.volatility.max)}`
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Prix moyen</span>
                  <div className="flex items-center gap-3">
                    {selectedProductMetrics?.avgPrice !== null &&
                    selectedProductMetrics?.avgPrice !== undefined ? (
                      <Badge variant="secondary" className="px-2.5 py-0.5 text-sm font-semibold">
                        {unitPriceFormatter.format(selectedProductMetrics.avgPrice)}€
                        <span className="ml-1 text-sm text-muted-foreground">
                          /{selectedProduct.unit}
                        </span>
                      </Badge>
                    ) : (
                      <span className="text-sm text-foreground">—</span>
                    )}
                    {selectedProductMetrics?.variation === null ||
                    selectedProductMetrics?.variation === undefined ? (
                      <span className="text-sm text-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-medium",
                          selectedProductMetrics.variation > 0
                            ? "text-red-500"
                            : selectedProductMetrics.variation < 0
                              ? "text-green-500"
                              : "text-muted-foreground"
                        )}
                      >
                        {selectedProductMetrics.variation > 0 ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                        ) : selectedProductMetrics.variation < 0 ? (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                        ) : null}
                        {selectedProductMetrics.variation > 0 ? "+" : ""}
                        {selectedProductMetrics.variation.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">
                    {selectedProductMetrics?.updatedAt
                      ? `Prix au ${selectedProductMetrics.updatedAt}`
                      : "Prix au —"}
                  </span>
                  <span className="text-sm text-foreground">
                    {selectedProductMetrics?.lastPrice !== null &&
                    selectedProductMetrics?.lastPrice !== undefined
                      ? `${unitPriceFormatter.format(selectedProductMetrics.lastPrice)}€/${selectedProduct.unit}`
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="rounded-md bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Acheté par</span>
                  {selectedProductMetrics?.interest !== null &&
                  selectedProductMetrics?.interest !== undefined ? (
                    (() => {
                      const tone = getInterestTone(selectedProductMetrics.interest)
                      const Icon = tone.icon
                      const count = Math.max(
                        1,
                        Math.round((selectedProductMetrics.interest / 100) * 120)
                      )
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-sm font-medium",
                            tone.className
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                          {count} restaurants / 120
                        </span>
                      )
                    })()
                  ) : (
                    <span className="text-sm text-foreground">—</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted-foreground">Recommandations</span>
                  {selectedProductMetrics?.recommendation ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                        selectedProductMetrics.recommendation === "Bon prix"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : selectedProductMetrics.recommendation === "Très demandé"
                            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300"
                            : selectedProductMetrics.recommendation === "À surveiller"
                              ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                              : selectedProductMetrics.recommendation === "Prix instable"
                                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                : selectedProductMetrics.recommendation === "Intérêt faible"
                                  ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"
                                  : selectedProductMetrics.recommendation === "Données anciennes"
                                    ? "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
                                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300"
                      )}
                    >
                      {selectedProductMetrics.recommendation}
                    </span>
                  ) : (
                    <span className="text-sm text-foreground">—</span>
                  )}
                </div>
              </div>
              {consultantNote ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={ConsultantAvatar} alt="Consultant" />
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">{consultantNote.title}</p>
                    <p className="text-sm text-muted-foreground">{consultantNote.message}</p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-6 text-sm text-muted-foreground">
              Sélectionnez un produit dans le tableau pour afficher le détail.
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
