"use client"

import { useMemo, useRef, useState } from "react"
import {
  Area,
  AreaChart as AreaRechart,
  CartesianGrid,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDown,
  ArrowUp,
  LineChart,
  RotateCcw,
  Wallet,
  Percent,
  TicketPercent,
  BadgeEuro,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type IntervalKey = "day" | "week" | "month"

type ArticlePoint = {
  label: string
  value: number
  date?: Date | string
}

export type DialogArticleChartProps = {
  articleName?: string
  symbol?: string
  unit?: string
  currency?: string
  currentValue?: number
  changePercent?: number
  triggerLabel?: React.ReactNode
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  data?: ArticlePoint[]
  defaultInterval?: IntervalKey
}

const defaultData: ArticlePoint[] = [
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

const chartConfig = {
  value: {
    label: "Cours",
    color: "var(--chart-1)",
  },
  baseline: {
    label: "Moyenne",
    color: "var(--border)",
  },
} satisfies ChartConfig

/**
 * Usage
 *
 * <DialogArticleChart
 *   articleName="Nom de l'article"
 *   unit="Litres"
 *   currency="EUR"
 *   currentValue={1234}
 *   changePercent={-3.4}
 *   data={[
 *     { label: "01", value: 1200, date: "2025-01-01" },
 *     { label: "02", value: 1210, date: "2025-01-02" },
 *     // ...
 *   ]}
 *   defaultInterval="week" // "day" | "week" | "month"
 * />
 *
 * - Fournir une seule liste de points (date + value). Le composant agrège par jour/semaine/mois selon l’onglet.
 * - Les dates sont filtrées via le DoubleDatePicker; par défaut : aujourd’hui et J-3 mois.
 * - Le zoom fonctionne par sélection (drag) ou scroll/pinch, bouton reset pour revenir au plein cadre.
 * - Les couleurs viennent des tokens (var(--chart-1)) définis dans index.css.
 */

const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)

const formatCurrencyFull = (value: number, currency: string) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

const formatCurrencyShort = (value: number, currency: string) => {
  if (!Number.isFinite(value)) return ""
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return formatCurrency(value, currency)
}

const formatChange = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`

const parsePointDate = (point: ArticlePoint) => {
  if (!point.date) return null
  if (point.date instanceof Date) return point.date
  const parsed = new Date(point.date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDisplayDate = (
  date: Date,
  { withYear = true }: { withYear?: boolean } = {}
) => {
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
  const day = date.getDate().toString().padStart(2, "0")
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  return withYear ? `${day} ${month}, ${year}` : `${day} ${month}`
}

const CustomTooltip = ({
  active,
  payload,
  label,
  currency,
  formatDisplayDate,
  parsePointDate,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  currency: string
  formatDisplayDate: (d: Date, opts?: { withYear?: boolean }) => string
  parsePointDate: (p: ArticlePoint) => Date | null
}) => {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as ArticlePoint
  const d = point ? parsePointDate(point) : null
  const displayDate = d ? formatDisplayDate(d) : label
  const value =
    typeof payload[0]?.value === "number"
      ? payload[0].value
      : Number(payload[0]?.value)

  return (
    <div className="min-w-[160px] rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{displayDate}</p>
      <p className="text-xs text-muted-foreground mt-1">Prix unitaire</p>
      <p className="text-lg font-semibold">
        {Number.isFinite(value) ? formatCurrencyFull(value, currency) : "--"}
      </p>
    </div>
  )
}

export default function DialogArticleChart({
  articleName = "Bitcoin USD",
  symbol = "BTC-USD",
  unit,
  currency = "USD",
  currentValue = 23097,
  changePercent = 5.9,
  triggerLabel = "Suivi de l'article",
  trigger,
  open,
  onOpenChange,
  data,
  defaultInterval = "week",
}: DialogArticleChartProps) {
  const defaultEnd = useMemo(() => new Date(), [])
  const defaultStart = useMemo(() => {
    const d = new Date(defaultEnd)
    d.setMonth(d.getMonth() - 3)
    return d
  }, [defaultEnd])

  const baseData = useMemo(
    () => (data && data.length ? data : defaultData),
    [data]
  )

  const [interval, setInterval] = useState<IntervalKey>(defaultInterval)
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStart)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEnd)
  const [zoomRange, setZoomRange] = useState<{ start?: Date; end?: Date }>({})
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null)
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [metric, setMetric] = useState("Prix unitaire")
  const chartRef = useRef<HTMLDivElement | null>(null)
  const lastTouchDistance = useRef<number | null>(null)

  const series = useMemo(() => {
    const map = new Map<
      string,
      { sum: number; count: number; date: Date; label: string }
    >()

    const getWeekNumber = (d: Date) => {
      const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      const dayNum = date.getUTCDay() || 7
      date.setUTCDate(date.getUTCDate() + 4 - dayNum)
      const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
      return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    }

    baseData.forEach((point) => {
      const d = parsePointDate(point)
      if (!d || typeof point.value !== "number") return

      let key = ""
      let label = point.label

      if (interval === "day") {
        key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
        label = formatDisplayDate(d, { withYear: false })
      } else if (interval === "week") {
        const week = getWeekNumber(d)
        key = `${d.getFullYear()}-W${week}`
        label = `S${week}`
      } else {
        key = `${d.getFullYear()}-${d.getMonth()}`
        const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]
        label = months[d.getMonth()]
      }

      const current = map.get(key)
      if (current) {
        current.sum += point.value
        current.count += 1
      } else {
        map.set(key, { sum: point.value, count: 1, date: d, label })
      }
    })

    return Array.from(map.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((item) => ({
        label: item.label,
        value: item.sum / item.count,
        date: item.date,
      }))
  }, [baseData, interval])

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
    if (!filteredSeries.length) return

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
      const distance = Math.hypot(
        t1.clientX - t2.clientX,
        t1.clientY - t2.clientY
      )
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
    const zoomFactor = 0.12
    const zoomAmount = currentRange * zoomFactor * direction

    const newStartTime = startTime + zoomAmount * mouseRatio
    const newEndTime = endTime - zoomAmount * (1 - mouseRatio)

    const clampedStart = Math.max(newStartTime, boundsStart.getTime())
    const clampedEnd = Math.min(newEndTime, boundsEnd.getTime())

    if (clampedEnd - clampedStart < 24 * 60 * 60 * 1000) return

    setZoomRange({ start: new Date(clampedStart), end: new Date(clampedEnd) })
  }

  const handleTouchEnd = () => {
    lastTouchDistance.current = null
  }

  const yDomain = useMemo(() => {
    if (!zoomedSeries.length) return undefined
    const values = zoomedSeries.map((p) => p.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined
    const padding = Math.max((max - min) * 0.05, 50)
    return [min - padding, max + padding] as [number, number]
  }, [zoomedSeries])
  const yTicks = useMemo(() => {
    if (!yDomain) return undefined
    const [min, max] = yDomain
    if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) {
      return undefined
    }
    const steps = 4
    const stepValue = (max - min) / steps
    return Array.from({ length: steps + 1 }, (_, idx) => min + stepValue * idx)
  }, [yDomain])

  const areaFill = 0.12
  const strokeWidth = 2.5
  const lastValue =
    zoomedSeries.length && Number.isFinite(zoomedSeries.at(-1)?.value)
      ? zoomedSeries.at(-1)!.value
      : undefined
  const displayedCurrentValue =
    typeof lastValue === "number" ? lastValue : currentValue
  const changeIsPositive = changePercent >= 0
  const deltaClass = changeIsPositive ? "text-green-500" : "text-red-500"
  const DeltaIcon = changeIsPositive ? ArrowUp : ArrowDown

  const triggerNode = trigger ? (
    <DialogTrigger asChild>{trigger}</DialogTrigger>
  ) : (
    <DialogTrigger asChild>
      <Button
        variant="outline"
        size="sm"
      >
        <LineChart className="size-4" />
        {triggerLabel}
      </Button>
    </DialogTrigger>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerNode}
      <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] rounded-2xl border border-border/70 bg-card/95 p-0 shadow-2xl backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <DialogHeader className="px-6 pt-6 pb-2 text-left">
          <DialogTitle className="sr-only">Variation de l&apos;article</DialogTitle>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground break-words whitespace-normal">
                {articleName} {`(Unité : ${unit ?? symbol ?? "—"})`}
              </p>
              <div className="flex items-end gap-3">
                <span className="text-2xl font-medium leading-none tracking-tight">
                  {formatCurrency(displayedCurrentValue, currency)}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center text-sm",
                    deltaClass
                  )}
                >
                  <DeltaIcon className="size-4" />
                  {formatChange(changePercent)}
                </span>
              </div>
            </div>
            <div className="w-full flex flex-wrap items-center gap-3 pt-2">
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-fit min-w-[150px]  bg-background dark:bg-primary dark:bg-secondary shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel className="text-xs font-normal text-muted-foreground">
                      Données
                    </SelectLabel>
                    <SelectItem value="Prix unitaire">
                      <span className="flex items-center gap-2">
                        <Wallet className="size-4" color="var(--muted-foreground)" />
                        Prix unitaire
                      </span>
                    </SelectItem>
                    <SelectItem value="Taxes">
                      <span className="flex items-center gap-2">
                        <Percent className="size-4" color="var(--muted-foreground)" />
                        Taxes
                      </span>
                    </SelectItem>
                    <SelectItem value="Réductions">
                      <span className="flex items-center gap-2">
                        <TicketPercent className="size-4" color="var(--muted-foreground)" />
                        Réductions
                      </span>
                    </SelectItem>
                    <SelectItem value="Prix brut">
                      <span className="flex items-center gap-2">
                        <BadgeEuro className="size-4" color="var(--muted-foreground)" />
                        Prix brut
                      </span>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <DoubleDatePicker
                startDate={startDate}
                endDate={endDate}
                onStartChange={setStartDate}
                onEndChange={setEndDate}
                defaultStartDate={defaultStart}
                defaultEndDate={defaultEnd}
                className="flex items-center gap-3"
                startButtonClassName="w-[160px]"
                endButtonClassName="w-[160px]"
                showStartLabel={false}
                showEndLabel={false}
              />

              <Tabs
                value={interval}
                onValueChange={(value) => setInterval(value as IntervalKey)}
                className="w-fit ml-auto"
              >
                <TabsList>
                  <TabsTrigger
                    value="day"
                    className="text-sm data-[state=inactive]:font-normal"
                  >
                    Jour
                  </TabsTrigger>
                  <TabsTrigger
                    value="week"
                    className="text-sm data-[state=inactive]:font-normal"
                  >
                    Semaine
                  </TabsTrigger>
                  <TabsTrigger
                    value="month"
                    className="text-sm data-[state=inactive]:font-normal"
                  >
                    Mois
                  </TabsTrigger>
              </TabsList>
            </Tabs>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setZoomRange({})}
                    disabled={!zoomRange.start && !zoomRange.end}
                    className="h-9 w-9"
                    aria-label="Réinitialiser le zoom"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Réinitialiser le graph</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        </DialogHeader>

        <div className="border-t border-border/70 px-6 pb-6 pt-4">
          <div
            ref={chartRef}
            onWheel={applyWheelOrPinchZoom}
            onTouchMove={applyWheelOrPinchZoom}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{ touchAction: "none" }}
          >
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <AreaRechart
                data={zoomedSeries}
                onMouseMove={(state) => {
                  setActiveIndex(
                    state?.activeTooltipIndex !== undefined
                      ? state.activeTooltipIndex
                      : null
                  )
                  if (
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
                  if (isSelecting && refAreaLeft !== null) {
                    const endIdx =
                      refAreaRight ?? activeIndex ?? refAreaLeft
                    if (endIdx !== null && refAreaLeft !== endIdx) {
                      const leftIdx = Math.min(refAreaLeft, endIdx)
                      const rightIdx = Math.max(refAreaLeft, endIdx)
                      const leftPoint = zoomedSeries[leftIdx]
                      const rightPoint = zoomedSeries[rightIdx]
                      const startDateZoom = parsePointDate(leftPoint || ({} as ArticlePoint))
                      const endDateZoom = parsePointDate(rightPoint || ({} as ArticlePoint))

                      if (startDateZoom && endDateZoom) {
                        const start = startDateZoom < endDateZoom ? startDateZoom : endDateZoom
                        const end = endDateZoom > startDateZoom ? endDateZoom : startDateZoom
                        setZoomRange({ start, end })
                      }
                    }
                  }
                  setIsSelecting(false)
                  setRefAreaLeft(null)
                  setRefAreaRight(null)
                }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--chart-1)"
                      stopOpacity={1}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={areaFill}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={12}
                  minTickGap={16}
                  tickFormatter={(label: string, index: number) => {
                    const point = zoomedSeries[index]
                    const d = point ? parsePointDate(point) : null
                    if (d) {
                      return formatDisplayDate(d, { withYear: false })
                    }
                    return label
                  }}
                  tick={({ x, y, payload }) => {
                    const idx = payload?.index
                    const point = idx !== undefined ? zoomedSeries[idx] : null
                    const d = point ? parsePointDate(point) : null
                    const text =
                      d ? formatDisplayDate(d, { withYear: false }) : payload?.value
                    const isActive =
                      activeIndex !== null && idx !== undefined && idx === activeIndex
                    return (
                    <text
                      x={x}
                      y={y + 10}
                      textAnchor="middle"
                      className={cn(
                        "text-xs fill-muted-foreground",
                        isActive && "fill-foreground font-medium"
                      )}
                    >
                      {text}
                    </text>
                  )
                  }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  domain={yDomain}
                  ticks={yTicks}
                  tickFormatter={(value: number) =>
                    `${formatCurrencyShort(value, currency)} €`
                  }
                />

                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                  content={
                    <CustomTooltip
                      currency={currency}
                      formatDisplayDate={formatDisplayDate}
                      parsePointDate={parsePointDate}
                    />
                  }
                />

                {refAreaLeft !== null && refAreaRight !== null && zoomedSeries.length > 1 ? (
                  <ReferenceArea
                    x1={zoomedSeries[Math.min(refAreaLeft, refAreaRight)]?.label}
                    x2={zoomedSeries[Math.max(refAreaLeft, refAreaRight)]?.label}
                    strokeOpacity={0.2}
                    fill="var(--chart-1)"
                    fillOpacity={0.08}
                  />
                ) : null}

                <Area
                  type="natural"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={strokeWidth}
                  fill="url(#areaGradient)"
                  fillOpacity={areaFill}
                  isAnimationActive={false}
                  activeDot={{ r: 5 }}
                  dot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaRechart>
            </ChartContainer>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
