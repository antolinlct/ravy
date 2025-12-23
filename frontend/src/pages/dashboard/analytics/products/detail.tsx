import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeEuro,
  BrainCircuit,
  Check,
  ChevronsUpDown,
  Info,
  Percent,
  TicketPercent,
  Wallet,
} from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AreaChart as AreaChartBlock, type AreaChartPoint, type IntervalKey } from "@/components/blocks/area-chart"
import { cn } from "@/lib/utils"

const ColumnHeader = ({ label, tooltip }: { label: string; tooltip: string }) => (
  <div className="inline-flex items-center gap-1">
    <span>{label}</span>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={`Info ${label}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  </div>
)

export default function ProductDetailPage() {
  const navigate = useNavigate()
  const [supplierComboOpen, setSupplierComboOpen] = useState(false)
  const [articleComboOpen, setArticleComboOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [selectedArticleId, setSelectedArticleId] = useState("")
  const alternativesScrollRef = useRef<HTMLDivElement | null>(null)
  const [showAlternativesBottomFade, setShowAlternativesBottomFade] = useState(false)
  const [costMetric, setCostMetric] = useState("Prix unitaire")
  const [costInterval, setCostInterval] = useState<IntervalKey>("month")
  const [costZoomRange, setCostZoomRange] = useState<{ start?: Date; end?: Date }>({})
  const [analysisRange, setAnalysisRange] = useState<{ start?: Date; end?: Date }>(() => ({
    start: new Date("2025-01-01"),
    end: new Date("2025-12-31"),
  }))
  const minAnalysisDate = useMemo(() => new Date("2022-01-01"), [])
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
  const euroFormatterNoDecimals = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  )
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )
  const supplierOptions = useMemo(
    () => [
      { id: "sysco", label: "Sysco France" },
      { id: "distriporc", label: "Distriporc" },
      { id: "transgourmet", label: "Transgourmet" },
      { id: "metro", label: "Metro" },
    ],
    []
  )

  const masterArticles = useMemo(
    () => [
      { id: "art-1", label: "Filet de poulet", supplierId: "sysco", lastPurchase: "2026-02-12" },
      { id: "art-2", label: "Steak hache 15%", supplierId: "sysco", lastPurchase: "2026-01-28" },
      { id: "art-3", label: "Bavette PAD FR", supplierId: "distriporc", lastPurchase: "2026-02-03" },
      { id: "art-4", label: "Tende de tranche", supplierId: "distriporc", lastPurchase: "2026-02-08" },
      { id: "art-5", label: "Frites surgelees 2,5kg", supplierId: "transgourmet", lastPurchase: "2026-01-19" },
      { id: "art-6", label: "Huile d'olive 5L", supplierId: "transgourmet", lastPurchase: "2026-02-01" },
      { id: "art-7", label: "Beurre AOP 250g", supplierId: "metro", lastPurchase: "2026-01-26" },
      { id: "art-8", label: "Cafe moulu 1kg", supplierId: "metro", lastPurchase: "2026-02-10" },
    ],
    []
  )

  const filteredArticles = useMemo(
    () => masterArticles.filter((article) => article.supplierId === selectedSupplierId),
    [masterArticles, selectedSupplierId]
  )
  const selectedArticle = useMemo(
    () => masterArticles.find((article) => article.id === selectedArticleId),
    [masterArticles, selectedArticleId]
  )
  const selectionSeed = useMemo(() => {
    if (!selectedArticleId) return 0
    return selectedArticleId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  }, [selectedArticleId])
  const costSeriesBase = useMemo<AreaChartPoint[]>(
    () => [
      { label: "01 Jan. 25", value: 0.18, date: "2025-01-01" },
      { label: "01 Fev. 25", value: 0.19, date: "2025-02-01" },
      { label: "01 Mar. 25", value: 0.22, date: "2025-03-01" },
      { label: "01 Avr. 25", value: 0.23, date: "2025-04-01" },
      { label: "01 Mai. 25", value: 0.23, date: "2025-05-01" },
      { label: "01 Juin. 25", value: 0.22, date: "2025-06-01" },
      { label: "01 Juil. 25", value: 0.22, date: "2025-07-01" },
      { label: "01 Aout. 25", value: 0.22, date: "2025-08-01" },
      { label: "01 Sep. 25", value: 0.22, date: "2025-09-01" },
    ],
    []
  )
  const costFactor = useMemo(() => (selectionSeed ? 1 + (selectionSeed % 5) * 0.01 : 1), [selectionSeed])
  const metricMultiplier = useMemo(() => {
    switch (costMetric) {
      case "Réductions":
        return 0.18
      case "Taxes":
        return 0.08
      case "Prix brut":
        return 1.12
      case "Prix unitaire":
      default:
        return 1
    }
  }, [costMetric])
  const unitCostSeries = useMemo(() => {
    if (!selectedArticleId) return []
    return costSeriesBase.map((point) => ({
      ...point,
      value: point.value ? Number((point.value * costFactor).toFixed(3)) : point.value,
    }))
  }, [costSeriesBase, costFactor, selectedArticleId])
  const costSeries = useMemo(() => {
    if (!selectedArticleId) return []
    if (metricMultiplier === 1) return unitCostSeries
    return unitCostSeries.map((point) => ({
      ...point,
      value: point.value ? Number((point.value * metricMultiplier).toFixed(3)) : point.value,
    }))
  }, [metricMultiplier, selectedArticleId, unitCostSeries])
  const filteredCostSeries = useMemo(() => {
    if (!costSeries.length) return []
    return costSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (analysisRange.start && date < analysisRange.start) return false
      if (analysisRange.end && date > analysisRange.end) return false
      return true
    })
  }, [analysisRange.end, analysisRange.start, costSeries])
  const zoomedCostSeries = useMemo(() => {
    if (!costZoomRange.start && !costZoomRange.end) return filteredCostSeries
    return filteredCostSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (costZoomRange.start && date < costZoomRange.start) return false
      if (costZoomRange.end && date > costZoomRange.end) return false
      return true
    })
  }, [costZoomRange.end, costZoomRange.start, filteredCostSeries])
  const latestCostValue = useMemo(() => {
    const lastPoint = zoomedCostSeries[zoomedCostSeries.length - 1]
    return typeof lastPoint?.value === "number" ? lastPoint.value : null
  }, [zoomedCostSeries])
  const costDelta = useMemo(() => {
    if (zoomedCostSeries.length < 2) return null
    const firstPoint = zoomedCostSeries[0]
    const lastPoint = zoomedCostSeries[zoomedCostSeries.length - 1]
    const lastValue = typeof lastPoint?.value === "number" ? lastPoint.value : null
    const firstValue = typeof firstPoint?.value === "number" ? firstPoint.value : null
    if (lastValue === null || firstValue === null || firstValue === 0) return null
    return (lastValue - firstValue) / firstValue
  }, [zoomedCostSeries])
  const costDeltaLabel = useMemo(() => {
    if (costDelta === null) return "--"
    const sign = costDelta > 0 ? "+" : ""
    return `${sign}${percentFormatter.format(costDelta)}`
  }, [costDelta, percentFormatter])
  const costDeltaIsPositive = costDelta !== null && costDelta >= 0
  const avgCost = useMemo(() => {
    if (!unitCostSeries.length) return null
    const sum = unitCostSeries.reduce((acc, point) => acc + (point.value ?? 0), 0)
    return sum / unitCostSeries.length
  }, [unitCostSeries])
  const marketCost = useMemo(() => {
    if (!avgCost) return null
    return avgCost * (selectionSeed % 2 === 0 ? 0.98 : 1.02)
  }, [avgCost, selectionSeed])
  const marketVolatility = useMemo(() => {
    if (!marketCost) return null
    const lower = marketCost * 0.92
    const upper = marketCost * 1.08
    return {
      from: Math.min(lower, upper),
      to: Math.max(lower, upper),
    }
  }, [marketCost])
  const unitLabel = "PC"
  const theoreticalConsumption = useMemo(() => {
    if (!selectedArticleId) return null
    return 252.9 + (selectionSeed % 4) * 18
  }, [selectedArticleId, selectionSeed])
  const potentialSavings = useMemo(() => {
    if (!avgCost || !marketCost || !theoreticalConsumption) return null
    return (avgCost - marketCost) * theoreticalConsumption
  }, [avgCost, marketCost, theoreticalConsumption])
  const recipesRows = useMemo(
    () => [
      { id: "r1", name: "Creme caramel", costStart: 2.84, costEnd: 3.12, impactEuro: 0.48, isActive: true, isSold: true },
      { id: "r2", name: "Salade Lyonnaise small", costStart: 1.92, costEnd: 2.05, impactEuro: 0.18, isActive: false, isSold: false },
      { id: "r3", name: "Pate a tarte", costStart: 0.78, costEnd: 0.9, impactEuro: 0.12, isActive: true, isSold: false },
      { id: "r4", name: "Moelleux chocolat", costStart: 3.21, costEnd: 3.83, impactEuro: 0.62, isActive: true, isSold: true },
      { id: "r5", name: "Tarte pralines", costStart: 2.14, costEnd: 2.06, impactEuro: -0.08, isActive: true, isSold: true },
    ],
    []
  )
  const invoiceRows = useMemo(
    () => [
      { id: "inv-1", number: "SYS-2025-001", items: 6, date: "08/01/2025", ttc: 312.4 },
      { id: "inv-2", number: "SYS-2025-014", items: 9, date: "22/02/2025", ttc: 486.9 },
      { id: "inv-3", number: "SYS-2025-027", items: 12, date: "15/03/2025", ttc: 842.15 },
      { id: "inv-4", number: "SYS-2025-039", items: 7, date: "28/04/2025", ttc: 398.7 },
      { id: "inv-5", number: "SYS-2025-052", items: 10, date: "12/06/2025", ttc: 674.2 },
      { id: "inv-6", number: "SYS-2025-071", items: 8, date: "03/09/2025", ttc: 521.35 },
    ],
    []
  )
  const parseInvoiceDate = (value: string) => {
    const [day, month, year] = value.split("/")
    if (!day || !month || !year) return null
    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }
  const formatInvoiceDate = (date: Date) => {
    const formatted = date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    return formatted.replace(".", "").replace(/\s(\d{4})$/, ", $1")
  }
  const filteredInvoiceRows = useMemo(() => {
    const rows =
      analysisRange.start && analysisRange.end
        ? invoiceRows.filter((invoice) => {
            const parsedDate = parseInvoiceDate(invoice.date)
            if (!parsedDate) return false
            return parsedDate >= analysisRange.start! && parsedDate <= analysisRange.end!
          })
        : invoiceRows

    return [...rows].sort((a, b) => {
      const dateA = parseInvoiceDate(a.date)?.getTime() ?? 0
      const dateB = parseInvoiceDate(b.date)?.getTime() ?? 0
      return dateB - dateA
    })
  }, [analysisRange.end, analysisRange.start, invoiceRows])
  const analysisStartLabel = useMemo(() => {
    if (!analysisRange.start) return "--"
    return analysisRange.start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisRange.start])
  const analysisEndLabel = useMemo(() => {
    if (!analysisRange.end) return "--"
    return analysisRange.end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisRange.end])
  const sortedRecipesRows = useMemo(() => {
    const getRank = (row: (typeof recipesRows)[number]) => {
      if (row.isActive && row.isSold) return 0
      if (row.isActive && !row.isSold) return 1
      return 2
    }
    return recipesRows
      .filter((row) => row.isActive)
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const rankDiff = getRank(a.row) - getRank(b.row)
        return rankDiff !== 0 ? rankDiff : a.index - b.index
      })
      .map(({ row }) => row)
  }, [recipesRows])
  const lastPurchaseLabel = useMemo(() => {
    if (!selectedArticleId) return "-"
    if (!selectedArticle?.lastPurchase) return "-"
    const date = new Date(selectedArticle.lastPurchase)
    if (Number.isNaN(date.getTime())) return "-"
    const months = [
      "janv",
      "fevr",
      "mars",
      "avr",
      "mai",
      "juin",
      "juil",
      "août",
      "sept",
      "oct",
      "nov",
      "dec",
    ]
    const day = String(date.getDate()).padStart(2, "0")
    const month = months[date.getMonth()] ?? ""
    return `${day} ${month}, ${date.getFullYear()}`
  }, [selectedArticle, selectedArticleId])
  const daysSinceLastPurchase = useMemo(() => {
    if (!selectedArticle?.lastPurchase) return null
    const date = new Date(selectedArticle.lastPurchase)
    if (Number.isNaN(date.getTime())) return null
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    return diffDays
  }, [selectedArticle])
  const supplierShare = useMemo(() => {
    if (!selectedArticleId) return null
    return Math.min(0.08 + (selectionSeed % 9) * 0.02, 0.45)
  }, [selectedArticleId, selectionSeed])
  const supplierMonthlySpend = useMemo(() => {
    if (!selectedArticleId) return null
    return 1200 + (selectionSeed % 8) * 230
  }, [selectedArticleId, selectionSeed])
  const supplierShareLabel = useMemo(() => {
    if (supplierShare === null) return "--"
    return percentFormatter.format(supplierShare)
  }, [percentFormatter, supplierShare])
  const hasSelection = Boolean(selectedArticleId)

  useEffect(() => {
    setCostZoomRange({})
  }, [analysisRange.end, analysisRange.start, selectedArticleId])

  useEffect(() => {
    const root = alternativesScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowAlternativesBottomFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
    }

    updateBottomFade()
    viewport.addEventListener("scroll", updateBottomFade, { passive: true })
    window.addEventListener("resize", updateBottomFade)

    return () => {
      viewport.removeEventListener("scroll", updateBottomFade)
      window.removeEventListener("resize", updateBottomFade)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Analyses produits</h1>
          <p className="text-sm text-muted-foreground">
            Suivez la performance de vos produits en détail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="detail" className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger
                value="general"
                className="flex-1 px-4"
                onClick={() => navigate("/dashboard/analytics/products")}
              >
                Général
              </TabsTrigger>
              <TabsTrigger value="detail" className="flex-1 px-4">
                Détails
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <CardTitle>Sélectionnez un produit à analyser</CardTitle>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex flex-col gap-2 min-w-[240px]">
                <Label className="text-xs font-medium text-muted-foreground">Fournisseur</Label>
                <Popover open={supplierComboOpen} onOpenChange={setSupplierComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={supplierComboOpen}
                      className="w-full justify-between"
                    >
                      {selectedSupplierId
                        ? supplierOptions.find((opt) => opt.id === selectedSupplierId)?.label
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
                                const next = value === selectedSupplierId ? "" : value
                                setSelectedSupplierId(next)
                                setSelectedArticleId("")
                                setSupplierComboOpen(false)
                                setArticleComboOpen(false)
                              }}
                            >
                              {opt.label}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedSupplierId === opt.id ? "opacity-100" : "opacity-0"
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

              <div className="flex flex-col gap-2 min-w-[300px]">
                <Label className="text-xs font-medium text-muted-foreground">Produit</Label>
                <Popover open={articleComboOpen} onOpenChange={setArticleComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={articleComboOpen}
                      className="w-full justify-between"
                      disabled={!selectedSupplierId}
                    >
                      {selectedArticleId
                        ? filteredArticles.find((opt) => opt.id === selectedArticleId)?.label
                        : selectedSupplierId
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
                          {filteredArticles.map((opt) => (
                            <CommandItem
                              key={opt.id}
                              value={opt.id}
                              onSelect={(value) => {
                                const next = value === selectedArticleId ? "" : value
                                setSelectedArticleId(next)
                                setArticleComboOpen(false)
                              }}
                            >
                              {opt.label}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedArticleId === opt.id ? "opacity-100" : "opacity-0"
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

              <DoubleDatePicker
                className="self-start"
                displayFormat="long"
                showSeparator
                minDate={minAnalysisDate}
                startDate={analysisRange.start}
                endDate={analysisRange.end}
                onChange={({ startDate, endDate }) => setAnalysisRange({ start: startDate, end: endDate })}
              />
            </div>

            <div className="flex flex-col items-start gap-2 self-center lg:items-end">
              <span className="text-xs font-medium text-muted-foreground">Dernier achat le</span>
              <span className="text-xl font-semibold self-end text-primary">{lastPurchaseLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>
                Analyse du produit {selectedArticle?.label ?? "-"}
              </CardTitle>
            </div>
          </div>

          {!hasSelection ? (
            <div className="flex min-h-[280px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
              Sélectionnez un produit pour afficher l&apos;analyse.
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <AreaChartBlock
                    data={costSeries}
                    variant="bare"
                    showHeader
                    showPrimaryValue={false}
                    title={null}
                    showDatePicker={false}
                    showIntervalTabs
                    defaultInterval={costInterval}
                    onIntervalChange={(value) => setCostInterval(value as IntervalKey)}
                    startDate={analysisRange.start}
                    endDate={analysisRange.end}
                    onZoomChange={setCostZoomRange}
                    height={260}
                    margin={{ left: -10 }}
                    tooltipLabel={costMetric}
                    valueFormatter={(value) => euroFormatter.format(value)}
                    tooltipValueFormatter={(value) => euroFormatter.format(value)}
                    xTickFormatter={(date) =>
                      date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
                    }
                    yTickFormatter={(value) => euroFormatter.format(value)}
                    yTickCount={4}
                    actions={
                      <Select value={costMetric} onValueChange={setCostMetric}>
                        <SelectTrigger className="w-fit min-w-[160px] bg-background dark:bg-secondary shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel className="text-xs font-normal text-muted-foreground">Données</SelectLabel>
                            <SelectItem value="Prix unitaire">
                              <span className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                Prix unitaire
                              </span>
                            </SelectItem>
                            <SelectItem value="Réductions">
                              <span className="flex items-center gap-2">
                                <TicketPercent className="h-4 w-4 text-muted-foreground" />
                                Réductions
                              </span>
                            </SelectItem>
                            <SelectItem value="Taxes">
                              <span className="flex items-center gap-2">
                                <Percent className="h-4 w-4 text-muted-foreground" />
                                Taxes
                              </span>
                            </SelectItem>
                            <SelectItem value="Prix brut">
                              <span className="flex items-center gap-2">
                                <BadgeEuro className="h-4 w-4 text-muted-foreground" />
                                Prix brut
                              </span>
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    }
                  />
                </div>
                <div className="lg:col-span-4 flex h-full flex-col justify-end">
                  <div className="lg:border-l lg:pl-6">
                    <div className="mb-4 rounded-md border bg-card p-3">
                      <p className="text-base font-semibold text-primary">{costMetric}</p>
                      <div className="mt-2 flex items-end justify-between gap-2">
                          <span className="text-lg font-semibold tabular-nums">
                            {latestCostValue !== null ? euroFormatter.format(latestCostValue) : "--"}
                          </span>
                          {costDelta === null ? (
                            <span className="text-sm text-muted-foreground">--</span>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-sm font-medium",
                                costDeltaIsPositive ? "text-green-500" : "text-red-500"
                              )}
                            >
                              {costDeltaIsPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                              {costDeltaLabel}
                            </span>
                          )}
                        </div>
                    </div>
                    <p className="text-base font-semibold text-primary">Performances</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-md bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Prix moyen d&apos;achat</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant="secondary" className="text-sm font-semibold">
                                {avgCost ? euroFormatter.format(avgCost) : "--"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">/ {unitLabel}</span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                          Prix moyen payé sur la période sélectionnée.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-md bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Prix du marché</p>
                            <p className="mt-2 text-sm font-semibold">
                              {marketCost ? euroFormatter.format(marketCost) : "--"}{" "}
                              <span className="text-xs text-muted-foreground">/ {unitLabel}</span>
                            </p>
                          </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                        {marketVolatility
                          ? `Le marché paye en moyenne ce prix par ${unitLabel} avec une volatilité entre ${euroFormatter.format(
                              marketVolatility.from
                            )} et ${euroFormatter.format(marketVolatility.to)}.`
                          : `Prix moyen observé sur le marché pour ce produit.`}
                      </TooltipContent>
                    </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-md bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Quantité consommée</p>
                            <p className="mt-2 text-sm font-semibold">
                              {theoreticalConsumption ? theoreticalConsumption.toFixed(1).replace(".", ",") : "--"}{" "}
                              <span className="text-xs text-muted-foreground">{unitLabel}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">par mois</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                          Consommation estimée sur le mois.
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded-md bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">Économies réalisables</p>
                            <p className="mt-2 text-sm font-semibold text-green-500">
                              {potentialSavings !== null ? euroFormatter.format(potentialSavings) : "--"}
                            </p>
                            <p className="text-xs text-muted-foreground">par mois</p>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                          Économies estimées si vous alignez vos achats sur le prix du marché.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              <Alert className="bg-muted/20 [&>svg]:top-1/2 [&>svg]:-translate-y-1/2">
                <Info className="h-4 w-4 text-primary" />
                <AlertDescription className="leading-snug !translate-y-0">
                  Vous n&apos;avez pas commandé chez ce fournisseur depuis{" "}
                  {daysSinceLastPurchase ?? "--"} jours, il représente{" "}
                  {supplierShareLabel} de vos achats mensuels (
                  {supplierMonthlySpend !== null
                    ? euroFormatterNoDecimals.format(Math.round(supplierMonthlySpend))
                    : "--"}
                  /mois).
                </AlertDescription>
              </Alert>

              <div className="rounded-md border">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">
                        Recettes impactées
                      </TableHead>
                      <TableHead className="w-32">
                        <ColumnHeader
                          label={`Coût au ${analysisStartLabel}`}
                          tooltip="Coût de production au début de la période sélectionnée."
                        />
                      </TableHead>
                      <TableHead className="w-32">
                        <ColumnHeader
                          label={`Coût au ${analysisEndLabel}`}
                          tooltip="Coût de production à la fin de la période sélectionnée."
                        />
                      </TableHead>
                      <TableHead className="w-28">
                        <ColumnHeader
                          label="Variation (%)"
                          tooltip="Évolution relative du coût de production sur la période."
                        />
                      </TableHead>
                      <TableHead className="w-28">
                        <ColumnHeader
                          label="Impact (€)"
                          tooltip="Impact en euros lié à l'évolution du prix de l'ingrédient."
                        />
                      </TableHead>
                      <TableHead className="w-10 text-right" />
                    </TableRow>
                  </TableHeader>
                </Table>
                <ScrollArea className="max-h-[360px]">
                  <Table className="table-fixed w-full">
                    <TableBody>
                      {sortedRecipesRows.map((row) => {
                        const costStart = row.costStart
                        const costEnd = row.costEnd
                        const costDelta =
                          typeof costStart === "number" && typeof costEnd === "number" && costStart !== 0
                            ? ((costEnd - costStart) / costStart) * 100
                          : null
                      const hasCost = row.isActive || row.isSold
                      const hasSignificantDelta =
                        typeof costDelta === "number" && Math.abs(costDelta) >= 0.001
                      const hasSignificantImpact =
                        typeof row.impactEuro === "number" && Math.abs(row.impactEuro) >= 0.001
                      const impactClass =
                        hasSignificantImpact
                          ? row.impactEuro >= 0
                            ? "text-red-500"
                            : "text-green-500"
                          : "text-muted-foreground"
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="w-[40%]">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{row.name}</p>
                              {hasCost ? (
                                <p className="text-xs text-muted-foreground">
                                  Coût actuel : {euroFormatter.format(costEnd)}
                                </p>
                              ) : null}
                              {!row.isActive ? (
                                <p className="text-xs text-muted-foreground">Recette inactive</p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-32 text-sm font-semibold",
                              hasCost ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {hasCost ? (
                              <span className="inline-flex items-baseline gap-1">
                                <span>{euroFormatter.format(costStart)}</span>
                                <span className="text-muted-foreground font-normal">/ portions</span>
                              </span>
                            ) : (
                              "--"
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-32 text-sm font-semibold",
                              hasCost ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {hasCost ? (
                              <span className="inline-flex items-baseline gap-1">
                                <span>{euroFormatter.format(costEnd)}</span>
                                <span className="text-muted-foreground font-normal">/ portions</span>
                              </span>
                            ) : (
                              "--"
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-28 text-sm font-semibold",
                              hasCost ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {hasCost && hasSignificantDelta ? (
                              <Badge
                                variant="outline"
                                className={
                                  costDelta > 0
                                    ? "border-red-500/20 bg-red-500/10 text-red-600"
                                    : costDelta < 0
                                      ? "border-green-500/20 bg-green-500/10 text-green-600"
                                      : "text-muted-foreground"
                                }
                              >
                                {costDelta > 0 ? "+" : ""}
                                {costDelta.toFixed(1).replace(".", ",")}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">--</span>
                            )}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-28 text-sm font-semibold",
                              hasCost ? impactClass : "text-muted-foreground"
                            )}
                          >
                            {hasCost && hasSignificantImpact
                              ? (
                                <span className="inline-flex items-baseline gap-1">
                                  <span>
                                    {row.impactEuro >= 0 ? "-" : "+"}
                                    {euroFormatter.format(Math.abs(row.impactEuro))}
                                  </span>
                                  <span className="text-muted-foreground font-normal">
                                    / {row.isSold ? "vente" : "portion"}
                                  </span>
                                </span>
                              )
                              : "--"}
                          </TableCell>
                          <TableCell className="w-10 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Produits alternatif</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs font-medium">
                      <BrainCircuit className="mr-1 h-3.5 w-3.5" />
                      Version beta
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                    Notre IA travaille à améliorer la pertinence des alternatives proposées.
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground">
                Alternatives potentielles au produit analysé
              </p>
            </div>
            <div className="flex h-[304px] flex-col overflow-hidden">
              <div className="relative flex-1 min-h-0" ref={alternativesScrollRef}>
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {[
                      { id: "alt-1", name: "Beurre AOP 250g", supplier: "Metro", price: 2.48 },
                      { id: "alt-2", name: "Beurre doux 250g", supplier: "Sysco France", price: 2.32 },
                      { id: "alt-3", name: "Beurre demi-sel 250g", supplier: "Distriporc", price: 2.26 },
                      { id: "alt-4", name: "Beurre doux 500g", supplier: "Metro", price: 4.62 },
                      { id: "alt-5", name: "Beurre doux 1kg", supplier: "Sysco France", price: 9.18 },
                      { id: "alt-6", name: "Beurre extra-fin 250g", supplier: "Transgourmet", price: 2.54 },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/60 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.supplier}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-sm font-semibold">
                            {euroFormatter.format(item.price)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                    showAlternativesBottomFade ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              <CardTitle>Factures liées au produit</CardTitle>
              <p className="text-sm text-muted-foreground">Factures qui contiennent le produit analysé</p>
            </div>
            <div className="rounded-md border">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-3">Facture</TableHead>
                    <TableHead className="w-36">Date</TableHead>
                    <TableHead className="w-28 text-center">TTC</TableHead>
                    <TableHead className="w-10 text-right" />
                  </TableRow>
                </TableHeader>
              </Table>
              <ScrollArea className="max-h-[264px]">
                <Table className="table-fixed w-full">
                  <TableBody>
                    {filteredInvoiceRows.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="pl-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Facture N° {invoice.number}</p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.items} {invoice.items > 1 ? "articles" : "article"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="w-36 text-sm text-muted-foreground">
                          {(() => {
                            const parsedDate = parseInvoiceDate(invoice.date)
                            return parsedDate ? formatInvoiceDate(parsedDate) : invoice.date
                          })()}
                        </TableCell>
                        <TableCell className="w-28 text-right">
                          <Badge variant="secondary" className="text-sm font-semibold">
                            {euroFormatter.format(invoice.ttc)}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-10 text-right">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredInvoiceRows.length ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">
                          Aucune facture sur la période sélectionnée.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
