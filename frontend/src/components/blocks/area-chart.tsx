"use client"

import React, { useId, useMemo, useRef, useState } from "react"
import {
  Area,
  AreaChart as AreaRechart,
  CartesianGrid,
  ReferenceArea as RechartsReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"
import type {
  AreaProps as RechartsAreaProps,
  ReferenceAreaProps as RechartsReferenceAreaProps,
} from "recharts"
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react"

import { DoubleDatePicker, type DoubleDatePickerValue } from "@/components/blocks/double-datepicker"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type IntervalKey = "day" | "week" | "month"

export type AreaChartPoint = {
  label?: string
  value?: number
  date?: Date | string
  [key: string]: unknown
}

export type AggregateFn<TPoint extends AreaChartPoint = AreaChartPoint> = (
  points: TPoint[],
  interval: IntervalKey,
  helpers: {
    getPointDate: (point: TPoint) => Date | null
    getPointValue: (point: TPoint) => number | null
    formatDisplayDate: (date: Date, opts?: { withYear?: boolean }) => string
  }
) => AreaChartPoint[]

type ReferenceAreaProps = Omit<RechartsReferenceAreaProps, "ref">
type AreaComponentProps = Omit<RechartsAreaProps, "ref">
const ReferenceArea = RechartsReferenceArea
type ChartTooltipContentType = React.ComponentProps<typeof ChartTooltip>["content"]
type ChartTooltipCursorType = React.ComponentProps<typeof ChartTooltip>["cursor"]

export type AreaChartProps<TPoint extends AreaChartPoint = AreaChartPoint> = {
  data?: TPoint[]
  chartConfig?: ChartConfig
  title?: React.ReactNode
  subtitle?: React.ReactNode
  showHeader?: boolean
  variant?: "card" | "bare"
  margin?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  titleClassName?: string
  subtitleClassName?: string
  primaryValue?: number | React.ReactNode
  primaryValueFormatter?: (value: number, point?: TPoint) => string
  primaryValueClassName?: string
  changePercent?: number
  changeFormatter?: (value: number) => string
  deltaClassName?: string
  positiveChangeClassName?: string
  negativeChangeClassName?: string
  positiveIcon?: React.ComponentType<{ className?: string }>
  negativeIcon?: React.ComponentType<{ className?: string }>
  currency?: string
  valueFormatter?: (value: number, point: TPoint) => string
  tooltipValueFormatter?: (value: number, point: TPoint) => React.ReactNode
  tooltipLabel?: React.ReactNode
  tooltipClassName?: string
  tooltipContent?: ChartTooltipContentType
  xTickFormatter?: (
    date: Date,
    label: string,
    index: number,
    point: TPoint
  ) => string
  xTickClassName?: string
  yTickFormatter?: (value: number) => string
  yTickClassName?: string
  yTickCount?: number
  yAxisValueSuffix?: string
  xAxisLabel?: React.ReactNode
  yAxisLabel?: React.ReactNode
  xAxisLabelStyle?: React.CSSProperties
  yAxisLabelStyle?: React.CSSProperties
  displayDateFormatter?: (date: Date, opts?: { withYear?: boolean }) => string
  defaultInterval?: IntervalKey
  intervalLabels?: Partial<Record<IntervalKey, string>>
  onIntervalChange?: (interval: IntervalKey) => void
  aggregate?: AggregateFn<TPoint>
  getPointDate?: (point: TPoint) => Date | null
  getPointValue?: (point: TPoint) => number | null
  startDate?: Date
  endDate?: Date
  defaultStartDate?: Date
  defaultEndDate?: Date
  onDateChange?: (value: DoubleDatePickerValue) => void
  resetZoomOnDateChange?: boolean
  showDatePicker?: boolean
  datePickerMode?: "editable" | "readonly" | "hidden"
  showIntervalTabs?: boolean
  enableZoom?: boolean
  enableWheelZoom?: boolean
  onZoomChange?: (range: { start?: Date; end?: Date }) => void
  initialZoomRange?: { start?: Date; end?: Date }
  zoomStep?: number
  yPadding?: number
  minYPadding?: number
  height?: number
  areaColor?: string
  areaFillOpacity?: number
  strokeWidth?: number
  className?: string
  chartClassName?: string
  containerProps?: React.ComponentProps<"div">
  chartContainerProps?: React.ComponentProps<typeof ChartContainer>
  rechartsProps?: Omit<
    React.ComponentProps<typeof AreaRechart>,
    "data" | "children"
  >
  areaProps?: Partial<AreaComponentProps>
  xAxisProps?: Partial<React.ComponentProps<typeof XAxis>>
  yAxisProps?: Partial<React.ComponentProps<typeof YAxis>>
  cartesianGridProps?: Partial<React.ComponentProps<typeof CartesianGrid>>
  tooltipProps?: Partial<React.ComponentProps<typeof ChartTooltip>>
  referenceAreaProps?: Partial<ReferenceAreaProps>
  actions?: React.ReactNode
  resetLabel?: string
  emptyState?: React.ReactNode
}

const defaultData: AreaChartPoint[] = [
  { label: "01", value: 22540, date: "2025-01-01" },
  { label: "02", value: 22880, date: "2025-01-02" },
  { label: "03", value: 23130, date: "2025-01-03" },
  { label: "04", value: 23360, date: "2025-01-04" },
  { label: "05", value: 23750, date: "2025-01-05" },
  { label: "06", value: 23620, date: "2025-01-06" },
  { label: "07", value: 23980, date: "2025-01-07" },
  { label: "08", value: 24150, date: "2025-01-08" },
  { label: "09", value: 24320, date: "2025-01-09" },
  { label: "10", value: 24600, date: "2025-01-10" },
  { label: "12", value: 24210, date: "2025-01-12" },
  { label: "15", value: 24580, date: "2025-01-15" },
  { label: "18", value: 24820, date: "2025-01-18" },
  { label: "20", value: 25010, date: "2025-01-20" },
]

const monthNames = [
  "Jan",
  "Fév",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sept",
  "Oct",
  "Nov",
  "Déc",
]

const defaultChartConfig = (color: string): ChartConfig => ({
  value: {
    label: "Valeur",
    color,
  },
  baseline: {
    label: "Moyenne",
    color: "var(--border)",
  },
})

const defaultFormatDisplayDate = (
  date: Date,
  { withYear = true }: { withYear?: boolean } = {}
) => {
  const day = date.getDate().toString().padStart(2, "0")
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return withYear ? `${day} ${month}, ${year}` : `${day} ${month}`
}

const defaultFormatChange = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`

const defaultGetPointDate = (point: AreaChartPoint) => {
  if (!point?.date) return null
  if (point.date instanceof Date) return point.date
  const parsed = new Date(point.date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const defaultGetPointValue = (point: AreaChartPoint) =>
  typeof point?.value === "number" ? point.value : null

const defaultFormatValue = (value: number, currency?: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: currency ? "currency" : "decimal",
    currency,
    maximumFractionDigits: currency ? 0 : 2,
  }).format(value)

const defaultFormatValueFull = (value: number, currency?: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: currency ? "currency" : "decimal",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const getCurrencySymbol = (currency?: string) => {
  if (!currency) return ""
  const parts = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).formatToParts(0)
  const symbol = parts.find((part) => part.type === "currency")?.value
  return symbol ?? currency
}

const defaultFormatValueShort = (value: number, currency?: string) => {
  if (!Number.isFinite(value)) return ""
  const currencySymbol = getCurrencySymbol(currency)
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M${
      currencySymbol ? ` ${currencySymbol}` : ""
    }`
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k${
      currencySymbol ? ` ${currencySymbol}` : ""
    }`
  }
  return defaultFormatValue(value, currency)
}

const defaultAggregate = <T extends AreaChartPoint>(
  points: T[],
  interval: IntervalKey,
  helpers: {
    getPointDate: (point: T) => Date | null
    getPointValue: (point: T) => number | null
    formatDisplayDate: (date: Date, opts?: { withYear?: boolean }) => string
  }
) => {
  const { getPointDate, getPointValue, formatDisplayDate } = helpers
  const map = new Map<
    string,
    { sum: number; count: number; date: Date; label: string }
  >()

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
    const dayNum = date.getUTCDay() || 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    return Math.ceil(
      ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    )
  }

  points.forEach((point) => {
    const d = getPointDate(point)
    const value = getPointValue(point)
    if (!d || value === null || !Number.isFinite(value)) return

    let key = ""
    let label = point.label ?? ""

    if (interval === "day") {
      key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      label = formatDisplayDate(d, { withYear: false })
    } else if (interval === "week") {
      const week = getWeekNumber(d)
      key = `${d.getFullYear()}-W${week}`
      label = `S${week}`
    } else {
      key = `${d.getFullYear()}-${d.getMonth()}`
      label = monthNames[d.getMonth()]
    }

    const current = map.get(key)
    if (current) {
      current.sum += value
      current.count += 1
    } else {
      map.set(key, { sum: value, count: 1, date: d, label })
    }
  })

  return Array.from(map.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((item) => ({
      label: item.label,
      value: item.sum / item.count,
      date: item.date,
    }))
}

const CustomTooltip = ({
  active,
  payload,
  label,
  valueLabel = "Valeur",
  formatDisplayDate,
  parsePointDate,
  formatValue,
  className,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  valueLabel?: React.ReactNode
  formatDisplayDate: (d: Date, opts?: { withYear?: boolean }) => string
  parsePointDate: (p: AreaChartPoint) => Date | null
  formatValue: (value: number, point: AreaChartPoint) => React.ReactNode
  className?: string
}) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as AreaChartPoint
  const d = point ? parsePointDate(point) : null
  const displayDate = d ? formatDisplayDate(d) : label
  const rawValue =
    typeof payload[0]?.value === "number"
      ? payload[0].value
      : Number(payload[0]?.value)

  return (
    <div
      className={cn(
        "min-w-[160px] rounded-lg border bg-background px-3 py-2 shadow-lg",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">{displayDate}</p>
      <div className="mt-2 border-t border-border/70" />
      {valueLabel ? (
        <p className="text-sm text-muted-foreground mt-1">{valueLabel}</p>
      ) : null}
      <p className="text-lg font-semibold">
        {Number.isFinite(rawValue) ? formatValue(rawValue, point) : "--"}
      </p>
    </div>
  )
}

/**
 * AreaChart
 *
 * - Comportement par défaut identique au graphique utilisé dans dialog-article-chart.tsx.
 * - Entièrement configurable : formatters, axes, couleurs, agrégation, plage de dates.
 */
export function AreaChart<TPoint extends AreaChartPoint = AreaChartPoint>({
  data,
  chartConfig,
  title = "Suivi",
  subtitle,
  titleClassName,
  subtitleClassName,
  primaryValue,
  primaryValueFormatter,
  primaryValueClassName,
  changePercent,
  changeFormatter = defaultFormatChange,
  deltaClassName,
  positiveChangeClassName = "text-green-500",
  negativeChangeClassName = "text-red-500",
  positiveIcon: PositiveIcon = ArrowUp,
  negativeIcon: NegativeIcon = ArrowDown,
  currency = "USD",
  valueFormatter,
  tooltipValueFormatter,
  tooltipLabel = "Valeur",
  tooltipClassName,
  tooltipContent,
  xTickFormatter,
  xTickClassName,
  yTickFormatter,
  yTickClassName,
  yTickCount = 4,
  yAxisValueSuffix = "",
  xAxisLabel,
  yAxisLabel,
  xAxisLabelStyle,
  yAxisLabelStyle,
  margin,
  displayDateFormatter = defaultFormatDisplayDate,
  defaultInterval = "week",
  intervalLabels,
  onIntervalChange,
  aggregate = defaultAggregate,
  getPointDate = defaultGetPointDate,
  getPointValue = defaultGetPointValue,
  startDate: controlledStartDate,
  endDate: controlledEndDate,
  defaultStartDate,
  defaultEndDate,
  onDateChange,
  resetZoomOnDateChange = false,
  showDatePicker = true,
  datePickerMode = "editable",
  showIntervalTabs = true,
  enableZoom = true,
  enableWheelZoom = false,
  onZoomChange,
  initialZoomRange,
  zoomStep = 0.12,
  yPadding = 0.05,
  minYPadding,
  height = 250,
  areaColor = "var(--chart-1)",
  areaFillOpacity = 0.12,
  strokeWidth = 2.5,
  showHeader = true,
  variant = "card",
  className,
  chartClassName,
  containerProps,
  chartContainerProps,
  rechartsProps,
  areaProps,
  xAxisProps,
  yAxisProps,
  cartesianGridProps,
  tooltipProps,
  referenceAreaProps,
  actions,
  resetLabel = "Réinitialiser le graph",
  emptyState,
}: AreaChartProps<TPoint>) {
  const {
    className: containerClassName,
    ...restContainerProps
  } = containerProps ?? {}
  const {
    className: chartContainerClassName,
    style: chartContainerStyle,
    config: _chartContainerConfig,
    ...restChartContainerProps
  } = chartContainerProps ?? {}
  const {
    cursor: tooltipCursor,
    content: tooltipContentProp,
    ...restTooltipProps
  } = tooltipProps ?? {}
  const resolvedChartConfig = useMemo(
    () => chartConfig ?? defaultChartConfig(areaColor),
    [chartConfig, areaColor]
  )
  const isBare = variant === "bare"
  const defaultMargin = useMemo(
    () => ({ left: -35, right: 20, top: 0, bottom: 0 }),
    []
  )
  const mergedMargin = useMemo(() => {
    const fromProps = margin ?? {}
    const fromRecharts = rechartsProps?.margin ?? {}
    return {
      ...defaultMargin,
      ...fromRecharts,
      ...fromProps,
    }
  }, [defaultMargin, margin, rechartsProps?.margin])

  const defaultEnd = useMemo(() => defaultEndDate ?? new Date(), [defaultEndDate])
  const defaultStart = useMemo(() => {
    if (defaultStartDate) return defaultStartDate
    const d = new Date(defaultEnd)
    d.setMonth(d.getMonth() - 3)
    return d
  }, [defaultStartDate, defaultEnd])

  const baseData = useMemo(
    () => (data && data.length ? data : defaultData) as TPoint[],
    [data]
  )

  const [interval, setInterval] = useState<IntervalKey>(defaultInterval)
  const [internalStartDate, setInternalStartDate] = useState<Date | undefined>(
    defaultStart
  )
  const [internalEndDate, setInternalEndDate] = useState<Date | undefined>(
    defaultEnd
  )
  const [zoomRange, setZoomRange] = useState<{ start?: Date; end?: Date }>(
    initialZoomRange ?? {}
  )
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null)
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const lastTouchDistance = useRef<number | null>(null)
  const uniqueId = useId()
  const gradientId = useMemo(
    () => `areaGradient-${uniqueId.replace(/:/g, "")}`,
    [uniqueId]
  )

  const startDate = controlledStartDate ?? internalStartDate
  const endDate = controlledEndDate ?? internalEndDate

  const parsePointDate = (point: AreaChartPoint) => getPointDate(point as TPoint)
  const parsePointValue = (point: AreaChartPoint) => getPointValue(point as TPoint)

  const formatValue = (value: number, point: AreaChartPoint) =>
    (valueFormatter ?? ((v: number) => defaultFormatValue(v, currency)))(
      value,
      point as TPoint
    )

  const formatTooltipValue = (value: number, point: AreaChartPoint) =>
    (tooltipValueFormatter ?? ((v: number) => defaultFormatValueFull(v, currency)))(
      value,
      point as TPoint
    )

  const series = useMemo(
    () =>
      aggregate(baseData, interval, {
        getPointDate,
        getPointValue,
        formatDisplayDate: displayDateFormatter,
      }),
    [aggregate, baseData, interval, getPointDate, getPointValue, displayDateFormatter]
  )

  const filteredSeries = useMemo(() => {
    if (!startDate && !endDate) return series
    return series.filter((point) => {
      const d = parsePointDate(point)
      if (!d) return false
      if (startDate && d < startDate) return false
      if (endDate && d > endDate) return false
      return true
    })
  }, [series, startDate, endDate])

  const zoomedSeries = useMemo(() => {
    if (!zoomRange.start && !zoomRange.end) return filteredSeries
    return filteredSeries.filter((point) => {
      const d = parsePointDate(point)
      if (!d) return false
      if (zoomRange.start && d < zoomRange.start) return false
      if (zoomRange.end && d > zoomRange.end) return false
      return true
    })
  }, [filteredSeries, zoomRange])

  const applyWheelOrPinchZoom = (
    event: React.WheelEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!enableZoom || !enableWheelZoom || !filteredSeries.length) return

    const boundsStart = parsePointDate(filteredSeries[0])
    const boundsEnd = parsePointDate(filteredSeries[filteredSeries.length - 1])
    if (!boundsStart || !boundsEnd) return

    const currentStart = zoomRange.start ?? boundsStart
    const currentEnd = zoomRange.end ?? boundsEnd
    const startTime = currentStart.getTime()
    const endTime = currentEnd.getTime()
    if (endTime <= startTime) return

    let direction = 0
    let clientX = 0

    if ("deltaY" in event) {
      direction = event.deltaY < 0 ? 1 : -1
      clientX = event.clientX
      event.preventDefault()
    } else if ("touches" in event && event.touches.length === 2) {
      const t1 = event.touches.item(0)
      const t2 = event.touches.item(1)
      if (!t1 || !t2) return
      const distance = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
      if (lastTouchDistance.current !== null) {
        direction = distance > lastTouchDistance.current ? 1 : -1
      }
      lastTouchDistance.current = distance
      clientX = (t1.clientX + t2.clientX) / 2
      event.preventDefault()
    } else {
      return
    }

    if (!chartRef.current || direction === 0) return

    const rect = chartRef.current.getBoundingClientRect()
    const mouseX = Math.min(Math.max(clientX - rect.left, 0), rect.width)
    const mouseRatio = rect.width > 0 ? mouseX / rect.width : 0.5

    const currentRange = endTime - startTime
    const zoomAmount = currentRange * (zoomStep || 0.12) * direction

    const newStartTime = startTime + zoomAmount * mouseRatio
    const newEndTime = endTime - zoomAmount * (1 - mouseRatio)

    const clampedStart = Math.max(newStartTime, boundsStart.getTime())
    const clampedEnd = Math.min(newEndTime, boundsEnd.getTime())

    if (clampedEnd - clampedStart < 24 * 60 * 60 * 1000) return

    const nextRange = { start: new Date(clampedStart), end: new Date(clampedEnd) }
    setZoomRange(nextRange)
    onZoomChange?.(nextRange)
  }

  const handleTouchEnd = () => {
    lastTouchDistance.current = null
  }

  const yDomain = useMemo(() => {
    if (!zoomedSeries.length) return undefined
    const values = zoomedSeries
      .map((p) => parsePointValue(p))
      .filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    if (!values.length) return undefined
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return undefined
    }
    const range = max - min
    const magnitude = Math.max(Math.abs(min), Math.abs(max), 1)
    const fallbackPadding = magnitude * 0.01
    const minPaddingValue = typeof minYPadding === "number" ? minYPadding : fallbackPadding
    const basePadding = Math.max(range * (yPadding ?? 0.05), minPaddingValue)
    const padding = range === 0 ? Math.max(fallbackPadding, minPaddingValue) : basePadding
    return [min - padding, max + padding] as [number, number]
  }, [zoomedSeries, parsePointValue, yPadding, minYPadding])

  const yTicks = useMemo(() => {
    if (!yDomain) return undefined
    const [min, max] = yDomain
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) {
      return undefined
    }
    const steps = Math.max(1, yTickCount)
    const stepValue = (max - min) / steps
    return Array.from({ length: steps + 1 }, (_, idx) => min + stepValue * idx)
  }, [yDomain, yTickCount])

  const lastValue =
    zoomedSeries.length && Number.isFinite(parsePointValue(zoomedSeries.at(-1)!))
      ? (parsePointValue(zoomedSeries.at(-1)!) as number)
      : undefined

  const resolvedPrimaryValue =
    typeof primaryValue === "number"
      ? primaryValueFormatter?.(primaryValue, zoomedSeries.at(-1) as TPoint) ??
        formatValue(primaryValue, zoomedSeries.at(-1) ?? {})
      : primaryValue ??
        (typeof lastValue === "number"
          ? primaryValueFormatter?.(lastValue, zoomedSeries.at(-1) as TPoint) ??
            formatValue(lastValue, zoomedSeries.at(-1) ?? {})
          : undefined)

  const changeIsPositive = typeof changePercent === "number" && changePercent >= 0
  const deltaClass =
    typeof changePercent === "number"
      ? changeIsPositive
        ? positiveChangeClassName
        : negativeChangeClassName
      : undefined
  const DeltaIcon = changeIsPositive ? PositiveIcon : NegativeIcon

  const intervalCopy: Record<IntervalKey, string> = {
    day: intervalLabels?.day ?? "Jour",
    week: intervalLabels?.week ?? "Semaine",
    month: intervalLabels?.month ?? "Mois",
  }

  const handleIntervalChange = (value: IntervalKey) => {
    setInterval(value)
    onIntervalChange?.(value)
  }

  const handleDateChange = (value: DoubleDatePickerValue) => {
    if (controlledStartDate === undefined) {
      setInternalStartDate(value.startDate)
    }
    if (controlledEndDate === undefined) {
      setInternalEndDate(value.endDate)
    }
    if (resetZoomOnDateChange) {
      setZoomRange({})
      onZoomChange?.({})
    }
    onDateChange?.(value)
  }

  const handleResetZoom = () => {
    setZoomRange({})
    onZoomChange?.({})
  }

  const resolvedChartContent: ChartTooltipContentType =
    tooltipContentProp ??
    tooltipContent ??
    ((props) => (
      <CustomTooltip
        {...props}
        valueLabel={tooltipLabel}
        formatDisplayDate={displayDateFormatter}
        parsePointDate={parsePointDate}
        formatValue={formatTooltipValue}
        className={tooltipClassName}
      />
    ))

  const resolvedCursor: ChartTooltipCursorType =
    tooltipCursor ??
    ({
      stroke: "var(--border)",
      strokeDasharray: "4 4",
    } as React.ComponentProps<typeof ChartTooltip>["cursor"])

  const xTick =
    xAxisProps?.tick ??
    (({ x, y, payload }: { x?: number; y?: number; payload?: any }) => {
      const idx = payload?.index
      const point = idx !== undefined ? zoomedSeries[idx] : null
      const d = point ? parsePointDate(point) : null
      const text =
        d && xTickFormatter
          ? xTickFormatter(d, payload?.value, idx ?? 0, point as TPoint)
          : d
            ? displayDateFormatter(d, { withYear: false })
            : payload?.value
      const isActive =
        activeIndex !== null && idx !== undefined && idx === activeIndex
      return (
        <text
          x={x}
          y={(y ?? 0) + 10}
          textAnchor="middle"
          className={cn(
            "text-xs fill-muted-foreground",
            xTickClassName,
            isActive && "fill-foreground font-medium"
          )}
        >
          {text}
        </text>
      )
    })

  const yTickFormat =
    yTickFormatter ??
    ((value: number) => `${defaultFormatValueShort(value, currency)}${yAxisValueSuffix}`)
  const xAxisLabelValue = xAxisProps?.label ?? xAxisLabel
  const yAxisLabelValue = yAxisProps?.label ?? yAxisLabel
  const yTickProp =
    yAxisProps?.tick ??
    (yTickClassName ? { className: yTickClassName } : undefined)
  const shouldShowDatePicker = showDatePicker && datePickerMode !== "hidden"
  const datePickerInteractive = datePickerMode === "editable"
  const horizontalCoordinatesGenerator = useMemo<
    React.ComponentProps<typeof CartesianGrid>["horizontalCoordinatesGenerator"]
  >(() => {
    if (cartesianGridProps?.horizontalCoordinatesGenerator) {
      return cartesianGridProps.horizontalCoordinatesGenerator
    }
    return ({ yAxis }) => {
      const scale = yAxis?.scale as ((value: number | string) => number) | undefined
      if (!scale || !yTicks?.length) return []
      const coords = yTicks
        .map((tick) => Number(scale(tick as number)))
        .filter((coord) => Number.isFinite(coord))
      return coords
    }
  }, [cartesianGridProps?.horizontalCoordinatesGenerator, yTicks])

  const showHeaderSection =
    showHeader &&
    (title || subtitle || resolvedPrimaryValue !== undefined || typeof changePercent === "number")
  const headerPaddingClass = isBare ? "pb-2" : "px-6 pt-6 pb-2 text-left"
  const chartPaddingClass = isBare
    ? ""
    : showHeaderSection
      ? "border-t border-border/70 px-6 pb-6 pt-4"
      : "px-6 pb-6 pt-6"

  return (
    <div
      className={cn(
        isBare
          ? "w-full overflow-hidden"
          : "w-full overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-0 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur",
        className,
        containerClassName
      )}
      {...restContainerProps}
    >
      {showHeaderSection ? (
        <div className={headerPaddingClass}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              {title ? (
                <p
                  className={cn(
                    "text-sm text-muted-foreground break-words whitespace-normal",
                    titleClassName
                  )}
                >
                  {title}
                </p>
              ) : null}
              {resolvedPrimaryValue !== undefined ? (
                <div className="flex items-end gap-3">
                  <span
                    className={cn(
                      "text-2xl font-medium leading-none tracking-tight",
                      primaryValueClassName
                    )}
                  >
                    {resolvedPrimaryValue}
                  </span>
                  {typeof changePercent === "number" ? (
                    <span
                      className={cn(
                        "inline-flex items-center text-sm",
                        deltaClassName,
                        deltaClass
                      )}
                    >
                      <DeltaIcon className="size-4" />
                      {changeFormatter(changePercent)}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {subtitle ? (
                <p
                  className={cn(
                    "text-xs text-muted-foreground break-words whitespace-normal",
                    subtitleClassName
                  )}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
            <div className="w-full flex flex-wrap items-center gap-3 pt-2">
              {actions}
              {shouldShowDatePicker ? (
                <div
                  className={cn(
                    "flex items-center gap-3",
                    !datePickerInteractive && "pointer-events-none opacity-60"
                  )}
                >
                  <DoubleDatePicker
                    startDate={startDate}
                    endDate={endDate}
                    onChange={handleDateChange}
                    defaultStartDate={defaultStart}
                    defaultEndDate={defaultEnd}
                    className="flex items-center gap-3"
                    startButtonClassName="w-[160px]"
                    endButtonClassName="w-[160px]"
                    showStartLabel={false}
                    showEndLabel={false}
                  />
                </div>
              ) : null}

              {showIntervalTabs ? (
                <Tabs
                  value={interval}
                  onValueChange={(value) => handleIntervalChange(value as IntervalKey)}
                  className="w-fit ml-auto"
                >
                  <TabsList>
                    <TabsTrigger
                      value="day"
                      className="text-sm data-[state=inactive]:font-normal"
                    >
                      {intervalCopy.day}
                    </TabsTrigger>
                    <TabsTrigger
                      value="week"
                      className="text-sm data-[state=inactive]:font-normal"
                    >
                      {intervalCopy.week}
                    </TabsTrigger>
                    <TabsTrigger
                      value="month"
                      className="text-sm data-[state=inactive]:font-normal"
                    >
                      {intervalCopy.month}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : null}

              {enableZoom ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleResetZoom}
                        disabled={!zoomRange.start && !zoomRange.end}
                        className="h-9 w-9"
                        aria-label={resetLabel}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{resetLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              
            </div>
          </div>
        </div>
      ) : null}

      <div className={chartPaddingClass}>
        <div
          ref={chartRef}
          onWheel={applyWheelOrPinchZoom}
          onTouchMove={applyWheelOrPinchZoom}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: "none" }}
        >
          <ChartContainer
            config={resolvedChartConfig}
            className={cn(
              "aspect-auto h-[250px] w-full",
              chartClassName,
              chartContainerClassName
            )}
            style={{ height, ...(chartContainerStyle ?? {}) }}
            {...restChartContainerProps}
          >
            <AreaRechart
              data={zoomedSeries}
              margin={mergedMargin}
              onMouseMove={(state) => {
                setActiveIndex(
                  state?.activeTooltipIndex !== undefined
                    ? state.activeTooltipIndex
                    : null
                )
                if (
                  enableZoom &&
                  isSelecting &&
                  state?.activeTooltipIndex !== undefined &&
                  state.activeTooltipIndex !== null
                ) {
                  setRefAreaRight(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => {
                setActiveIndex(null)
                setRefAreaLeft(null)
                setRefAreaRight(null)
                setIsSelecting(false)
              }}
              onMouseDown={(state) => {
                if (!enableZoom) return
                if (
                  state?.activeTooltipIndex !== undefined &&
                  state.activeTooltipIndex !== null
                ) {
                  setIsSelecting(true)
                  setRefAreaLeft(state.activeTooltipIndex)
                  setRefAreaRight(null)
                }
              }}
              onMouseUp={() => {
                if (enableZoom && isSelecting && refAreaLeft !== null) {
                  const endIdx = refAreaRight ?? activeIndex ?? refAreaLeft
                  if (endIdx !== null && refAreaLeft !== endIdx) {
                    const leftIdx = Math.min(refAreaLeft, endIdx)
                    const rightIdx = Math.max(refAreaLeft, endIdx)
                    const leftPoint = zoomedSeries[leftIdx]
                    const rightPoint = zoomedSeries[rightIdx]
                    const startDateZoom = parsePointDate(
                      leftPoint || ({} as AreaChartPoint)
                    )
                    const endDateZoom = parsePointDate(
                      rightPoint || ({} as AreaChartPoint)
                    )

                    if (startDateZoom && endDateZoom) {
                      const start =
                        startDateZoom < endDateZoom ? startDateZoom : endDateZoom
                      const end = endDateZoom > startDateZoom ? endDateZoom : startDateZoom
                      const nextRange = { start, end }
                      setZoomRange(nextRange)
                      onZoomChange?.(nextRange)
                    }
                  }
                }
                setIsSelecting(false)
                setRefAreaLeft(null)
                setRefAreaRight(null)
              }}
              {...rechartsProps}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={areaColor} stopOpacity={1} />
                  <stop
                    offset="95%"
                    stopColor={areaColor}
                    stopOpacity={areaFillOpacity}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="4 4"
                horizontalCoordinatesGenerator={horizontalCoordinatesGenerator}
                {...cartesianGridProps}
              />

              {yTicks && yTicks.length > 0 ? (
                <ReferenceLine
                  y={yTicks[0]}
                  stroke="var(--border)"
                  strokeDasharray="0"
                  strokeWidth={1}
                />
              ) : null}

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                minTickGap={16}
                tick={xTick}
                label={
                  xAxisLabelValue
                    ? {
                        value: xAxisLabelValue,
                        position: "insideBottom",
                        offset: -4,
                        style: {
                          fontSize: 11,
                          fill: "var(--muted-foreground)",
                          ...(xAxisLabelStyle ?? {}),
                        },
                        ...(typeof xAxisProps?.label === "object" ? xAxisProps.label : {}),
                      }
                    : xAxisProps?.label
                }
                {...xAxisProps}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={70}
                domain={yDomain}
                ticks={yTicks}
                tickFormatter={yTickFormat}
                tick={yTickProp}
                label={
                  yAxisLabelValue
                    ? {
                        value: yAxisLabelValue,
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        style: {
                          fontSize: 11,
                          fill: "var(--muted-foreground)",
                          ...(yAxisLabelStyle ?? {}),
                        },
                        ...(typeof yAxisProps?.label === "object" ? yAxisProps.label : {}),
                      }
                    : yAxisProps?.label
                }
                {...yAxisProps}
              />

              <ChartTooltip
                cursor={resolvedCursor}
                content={resolvedChartContent}
                {...restTooltipProps}
              />

              {enableZoom &&
              refAreaLeft !== null &&
              refAreaRight !== null &&
              zoomedSeries.length > 1 ? (
                <ReferenceArea
                  x1={zoomedSeries[Math.min(refAreaLeft, refAreaRight)]?.label}
                  x2={zoomedSeries[Math.max(refAreaLeft, refAreaRight)]?.label}
                  strokeOpacity={0.2}
                  fill={areaColor}
                  fillOpacity={0.08}
                  {...referenceAreaProps}
                />
              ) : null}

              <Area
                type="natural"
                dataKey="value"
                stroke={areaColor}
                strokeWidth={strokeWidth}
                fill={`url(#${gradientId})`}
                fillOpacity={areaFillOpacity}
                isAnimationActive={false}
                activeDot={{ r: 5 }}
                dot={{ r: 4, strokeWidth: 0 }}
                {...areaProps}
              />
            </AreaRechart>
          </ChartContainer>
          {!zoomedSeries.length && emptyState ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyState}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/* Documentation d'usage (optimisée LLM)
   Objectif : bloc AreaChart générique, même rendu/interaction que l’ancien dialog-article-chart, mais entièrement configurable.

   Props essentiels
   - data?: Array<{ date: Date | string; value: number; label?: string; ... }> ; si vide → données démo.
   - chartConfig?: ChartConfig ; couleurs/labels Recharts (défaut: var(--chart-1)).
   - title?: ReactNode ; texte haut-gauche (ex: nom de métrique).
   - subtitle?: ReactNode ; petit texte sous le titre.
   - primaryValue?: number | ReactNode ; valeur affichée en gros (défaut = dernier point).
   - primaryValueFormatter?: (value, point?) => string ; format du primaryValue.
   - changePercent?: number ; variation affichée avec flèche.
   - changeFormatter?: (value) => string ; format variation (défaut +X.X%).
   - currency?: string ; sert aux formatters par défaut (USD par défaut).
   - valueFormatter?: (value, point) => string ; format axe Y.
   - tooltipValueFormatter?: (value, point) => ReactNode ; format valeur du tooltip.
   - tooltipLabel?: ReactNode ; libellé du tooltip (ex: “Prix unitaire”).
   - tooltipClassName?: string ; override style du tooltip par défaut.
   - tooltipContent?: ChartTooltip content ; pour injecter un tooltip custom Recharts.
   - xTickClassName? / yTickClassName? ; style des ticks.
   - xAxisLabel? / yAxisLabel? (+ xAxisLabelStyle / yAxisLabelStyle) ; titres d’axes.
   - titleClassName / subtitleClassName / primaryValueClassName / deltaClassName ; override texte header.
   - showHeader?: boolean (défaut true) ; pour masquer toute la zone de titre/valeurs.
   - variant?: "card" | "bare" (défaut "card") ; rend le bloc sans card (border/bg) si "bare".
   - xTickFormatter?: (date, label, index, point) => string ; format axe X.
   - yTickFormatter?: (value) => string ; format axe Y.
   - defaultInterval?: "day" | "week" | "month" (défaut week).
   - intervalLabels?: { day?: string; week?: string; month?: string } ; textes des onglets.
   - aggregate?: (points, interval, helpers) => AreaChartPoint[] ; agrégation custom (défaut: moyenne par période).
   - getPointDate?: (point) => Date | null ; extraction date custom.
   - getPointValue?: (point) => number | null ; extraction valeur custom.
   - startDate / endDate + onDateChange ; plage contrôlée (sinon interne via DoubleDatePicker).
   - showDatePicker?: boolean (défaut true).
   - datePickerMode?: "editable" | "readonly" | "hidden" (défaut "editable") ; pour afficher et verrouiller, ou cacher le sélecteur.
   - showIntervalTabs?: boolean (défaut true).
   - enableZoom?: boolean (défaut true) ; zoom par sélection.
   - enableWheelZoom?: boolean (défaut false) ; zoom via scroll/pinch.
   - onZoomChange?: ({ start?, end? }) => void ; callback zoom.
   - initialZoomRange?: { start?, end? } ; zoom initial.
   - zoomStep?: number (défaut 0.12) ; sensibilité zoom.
   - yPadding?: number (défaut 0.05) ; padding relatif du domaine Y.
   - minYPadding?: number ; padding min en unités (si non fourni, fallback 1% magnitude).
   - margin?: { left?: number; right?: number; top?: number; bottom?: number } (défaut left -35, right 20, top/bottom 0).
   - height?: number (défaut 250) ; hauteur (appliquée au ChartContainer).
   - areaColor?: string (défaut var(--chart-1)).
   - areaFillOpacity?: number (défaut 0.12).
   - strokeWidth?: number (défaut 2.5).
   - areaProps / xAxisProps / yAxisProps / cartesianGridProps / tooltipProps / referenceAreaProps ; override direct des props Recharts.
   - actions?: ReactNode ; slot bouton/controls à droite de la barre d’outils.
   - resetLabel?: string ; aria/tooltip du bouton reset.
   - emptyState?: ReactNode ; rendu si aucune donnée après filtre/zoom.

   Comportement par défaut
   - Agrégation par jour/semaine/mois via onglets.
   - Filtre par DoubleDatePicker (plage interne J-3 mois → aujourd’hui).
   - Zoom : molette/pinch centré sous le curseur, ou drag pour sélectionner, bouton reset.
   - Tooltip custom affichant date + valeur formatée (currency si fourni).
   - Rendu identique à l’ancien chart (grid, dégradé, dots actifs, curseur dashed).

   Exemples d’usage

   1) Usage minimal (équivalent article)
   <AreaChart
     title={`${articleName} (Unité : ${unit ?? symbol ?? "—"})`}
     primaryValue={currentValue}
     changePercent={changePercent}
     currency="EUR"
     data={data}
     defaultInterval="week"
   />

   2) Format personnalisé (pourcentage) + axes custom
   <AreaChart
     title="Taux de conversion"
     subtitle="Shop FR"
     currency={undefined}
     valueFormatter={(v) => `${v.toFixed(2)} %`}
     tooltipValueFormatter={(v) => `${v.toFixed(2)} %`}
     yTickFormatter={(v) => `${v.toFixed(0)} %`}
     defaultInterval="day"
     data={points} // { date, value }
   />

   3) Agrégation custom (médians) + couleur custom + actions
   <AreaChart
     title="Panier moyen"
     currency="EUR"
     areaColor="hsl(var(--primary))"
     aggregate={(points, interval, helpers) => {
       const byKey: Record<string, number[]> = {}
       const { getPointDate, getPointValue, formatDisplayDate } = helpers
       const keyFor = (d: Date) =>
         interval === "day"
           ? formatDisplayDate(d, { withYear: false })
           : interval === "week"
             ? `S${Math.ceil((d.getDate() - d.getDay()) / 7)}`
             : monthNames[d.getMonth()]
       points.forEach((p) => {
         const d = getPointDate(p)
         const v = getPointValue(p)
         if (!d || v == null) return
         const key = keyFor(d)
         byKey[key] = [...(byKey[key] ?? []), v]
       })
       return Object.entries(byKey).map(([label, values]) => {
         const sorted = values.sort((a, b) => a - b)
         const mid = Math.floor(sorted.length / 2)
         const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
         const sampleDate = helpers.getPointDate(points[0]!)
         return { label, value: median, date: sampleDate }
       })
     }}
     actions={<Button size="sm">Exporter</Button>}
   />

   4) Tooltip custom Recharts
   <AreaChart
     data={data}
     tooltipContent={({ active, payload }) =>
       active && payload?.length ? (
         <div className="rounded-md border bg-background px-2 py-1 text-xs">
           {payload[0].payload.label}: {payload[0].value} unités
         </div>
       ) : null
     }
   />

   5) Contrôle externe du zoom et des dates
   const [range, setRange] = useState<{ start?: Date; end?: Date }>({})
   const [dates, setDates] = useState<DoubleDatePickerValue>({})
   <AreaChart
     data={data}
     startDate={dates.startDate}
     endDate={dates.endDate}
     onDateChange={setDates}
     initialZoomRange={range}
     onZoomChange={setRange}
   />

   Bonnes pratiques
   - Fournir un dataKey “value” et une “date” sur chaque point pour profiter de l’agrégation par défaut.
   - Utiliser les formatters (valueFormatter, tooltipValueFormatter, xTickFormatter) pour coller au métier (€, %, unités).
   - Désactiver showDatePicker/showIntervalTabs si le contexte gère déjà la plage/agrégation.
   - areaProps / xAxisProps / yAxisProps permettent de brancher des callbacks Recharts avancés (ex: onClick datapoint).
   - Sur données volumineuses, préférer une agrégation côté backend et passer l’intervalle désiré via defaultInterval.
*/
