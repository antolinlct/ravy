import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
} from "lucide-react"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { AreaChart as AreaChartBlock, type IntervalKey } from "@/components/blocks/area-chart"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import { useEstablishment } from "@/context/EstablishmentContext"
import ConsultantAvatar from "@/assets/avatar.png"
import {
  buildSupplierOptions,
  buildSupplierSeries,
  formatVariationLabel,
  supplierLabelDisplay,
  useMarketComparisons,
  useProductOverviewData,
} from "./api"
import type { SupplierLabel } from "./types"

const getDeltaTier = (delta: number) => {
  if (delta < 0) return 0
  if (delta < 2) return 1
  if (delta < 10) return 2
  return 3
}

const getBatteryTextClass = (delta: number) => {
  if (delta >= 10) return "text-red-500"
  if (delta >= 2) return "text-orange-500"
  if (delta >= 0) return "text-yellow-500"
  return "text-green-500"
}

export default function ProductAnalyticsPage() {
  const navigate = useNavigate()
  const { estId } = useEstablishment()
  const variationsTickerRef = useRef<HTMLDivElement | null>(null)
  const variationsTickerTrackRef = useRef<HTMLDivElement | null>(null)
  const suppliersScrollRef = useRef<HTMLDivElement | null>(null)
  const productsListRef = useRef<HTMLDivElement | null>(null)
  const [showSuppliersBottomFade, setShowSuppliersBottomFade] = useState(false)
  const [showProductsListFade, setShowProductsListFade] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>("all")
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [supplierInterval, setSupplierInterval] = useState<IntervalKey>("week")
  const minSupplierDate = useMemo(() => new Date("2022-01-01"), [])
  const [supplierRange, setSupplierRange] = useState<{ start?: Date; end?: Date }>(() => ({
    start: new Date("2025-01-01"),
    end: new Date("2025-12-31"),
  }))
  const {
    suppliers,
    masterArticles,
    invoices,
    productAggregates,
    variations,
  } = useProductOverviewData(estId, supplierRange.start, supplierRange.end)
  const diffNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )
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
  const euroFormatter0 = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  )
  const euroFormatterWith2 = euroFormatter

  const productSuppliersOptions = useMemo(
    () => buildSupplierOptions(suppliers),
    [suppliers]
  )
  const [productSelectedSuppliers, setProductSelectedSuppliers] = useState<string[]>([])
  const [productTop, setProductTop] = useState<"10" | "25" | "50" | "all">("10")
  const [productSort, setProductSort] = useState<"default" | "asc" | "desc">("default")

  const scrollProductItemToTop = (element: HTMLElement | null) => {
    if (!element) return
    const viewport = productsListRef.current?.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) {
      element.scrollIntoView({ block: "start", behavior: "smooth" })
      return
    }
    const elementRect = element.getBoundingClientRect()
    const viewportRect = viewport.getBoundingClientRect()
    const offset = elementRect.top - viewportRect.top
    viewport.scrollTo({ top: viewport.scrollTop + offset, behavior: "smooth" })
  }
  const suppliersById = useMemo(() => new Map(suppliers.map((supplier) => [supplier.id, supplier])), [suppliers])
  const masterArticlesById = useMemo(
    () => new Map(masterArticles.map((article) => [article.id, article])),
    [masterArticles]
  )
  const quantityFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
    []
  )
  const productBaseItems = useMemo(
    () =>
      productAggregates.map((aggregate) => {
        const master = masterArticlesById.get(aggregate.masterArticleId)
        const supplier = aggregate.supplierId ? suppliersById.get(aggregate.supplierId) : undefined
        const unit = aggregate.unit ?? master?.unit ?? "unité"
        const qtyLabel =
          aggregate.totalQty > 0
            ? `${quantityFormatter.format(aggregate.totalQty)} ${unit}`
            : `-- ${unit}`
        return {
          id: aggregate.masterArticleId,
          name: master?.name ?? "Article",
          supplier: supplier?.name ?? "Fournisseur",
          supplierId: aggregate.supplierId ?? "",
          consumption: aggregate.totalSpend,
          paidPrice: aggregate.avgUnitPrice,
          marketPrice: aggregate.avgUnitPrice,
          deltaPct: 0,
          qty: qtyLabel,
          qtyValue: aggregate.totalQty,
          unit,
          marketTrend: { from: aggregate.avgUnitPrice, to: aggregate.avgUnitPrice },
        }
      }),
    [masterArticlesById, productAggregates, quantityFormatter, suppliersById]
  )
  const productTopOptions = [
    { value: "10", label: "Top 10" },
    { value: "25", label: "Top 25" },
    { value: "50", label: "Top 50" },
    { value: "all", label: "Tous" },
  ] as const
  const topProductBaseItems = useMemo(() => {
    let list = productBaseItems.filter(
      (product) =>
        productSelectedSuppliers.length === 0 ||
        productSelectedSuppliers.includes(product.supplierId)
    )
    list = [...list].sort((a, b) => b.consumption - a.consumption)
    const limit = productTop === "all" ? list.length : Number(productTop)
    return list.slice(0, limit)
  }, [productBaseItems, productSelectedSuppliers, productTop])

  const topProductIds = useMemo(
    () => topProductBaseItems.map((item) => item.id),
    [topProductBaseItems]
  )
  const marketComparisons = useMarketComparisons(
    estId,
    topProductIds,
    supplierRange.start,
    supplierRange.end
  )

  const filteredProductItems = useMemo(() => {
    let list = topProductBaseItems.map((item) => {
      const comparison = marketComparisons[item.id]
      const marketPrice = comparison?.statsMarket.avgPrice || item.marketPrice
      const minPrice = comparison?.statsMarket.minPrice ?? marketPrice
      const maxPrice = comparison?.statsMarket.maxPrice ?? marketPrice
      const deltaPct =
        marketPrice > 0 ? ((item.paidPrice - marketPrice) / marketPrice) * 100 : 0
      return {
        ...item,
        marketPrice,
        deltaPct,
        marketTrend: {
          from: Math.min(minPrice ?? marketPrice, maxPrice ?? marketPrice),
          to: Math.max(minPrice ?? marketPrice, maxPrice ?? marketPrice),
        },
      }
    })
    if (productSort !== "default") {
      const direction = productSort === "asc" ? 1 : -1
      list = [...list].sort((a, b) => {
        const tierDiff = getDeltaTier(a.deltaPct) - getDeltaTier(b.deltaPct)
        if (tierDiff !== 0) return tierDiff * direction
        return b.consumption - a.consumption
      })
    }
    return list
  }, [marketComparisons, productSort, topProductBaseItems])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const selectedProduct = useMemo(
    () => filteredProductItems.find((p) => p.id === selectedProductId) ?? filteredProductItems[0] ?? null,
    [filteredProductItems, selectedProductId]
  )
  const selectedProductEconomy = useMemo(() => {
    if (!selectedProduct) return null
    const qtyValue = selectedProduct.qtyValue ?? 0
    const deltaPerUnit = selectedProduct.paidPrice - selectedProduct.marketPrice
    const monthlyDelta = deltaPerUnit * qtyValue
    const yearlyDelta = monthlyDelta * 12
    const absDeltaPerUnit = euroFormatterWith2.format(Math.abs(deltaPerUnit))
    const absMonthly = euroFormatterWith2.format(Math.abs(monthlyDelta))
    const absYearly = euroFormatterWith2.format(Math.abs(yearlyDelta))
    const productName = selectedProduct.name
    const unitLabel = selectedProduct.unit ?? "unité"
    const tier = getDeltaTier(selectedProduct.deltaPct)
    const colorClass = getBatteryTextClass(selectedProduct.deltaPct)

    if (tier === 0) {
      return {
        mode: "saving" as const,
        productName,
        amountPerUnit: absDeltaPerUnit,
        unitLabel,
        line2: "Aucune conséquence négative sur votre restaurant.",
      }
    }
    if (tier === 1) {
      return {
        mode: "loss" as const,
        productName,
        line1Lead: "Vous payez le ",
        line1Trail: " légèrement plus cher que le marché. Vous pourriez gagner ",
        line1Tail: " en négociant mieux vos achats.",
        line2Prefix: "Vous perdez actuellement ",
        line2Suffix: " à cause de ce produit.",
        monthly: absMonthly,
        yearly: absYearly,
        colorClass,
      }
    }
    if (tier === 2) {
      return {
        mode: "loss" as const,
        productName,
        line1Lead: "Vous payez le ",
        line1Trail: " trop cher par rapport au marché. Vous pourriez gagner ",
        line1Tail: " en négociant mieux vos achats.",
        line2Prefix: "Vous perdez actuellement ",
        line2Suffix: " à cause de ce produit.",
        monthly: absMonthly,
        yearly: absYearly,
        colorClass,
      }
    }
    return {
      mode: "loss" as const,
      productName,
      line1Lead: "Vous payez le ",
      line1Trail: " beaucoup trop cher par rapport au marché. Vous pourriez gagner ",
      line1Tail: " en négociant mieux vos achats.",
      line2Prefix: "Vous perdez actuellement ",
      line2Suffix: " à cause de ce produit.",
      monthly: absMonthly,
      yearly: absYearly,
      colorClass,
    }
  }, [selectedProduct, euroFormatterWith2])
  useEffect(() => {
    if (filteredProductItems.length === 0) {
      setSelectedProductId(null)
    } else if (!selectedProduct || !filteredProductItems.some((p) => p.id === selectedProduct.id)) {
      setSelectedProductId(filteredProductItems[0].id)
    }
  }, [filteredProductItems, selectedProduct])
  const supplierLabelEnum = useMemo(
    () => Object.keys(supplierLabelDisplay) as SupplierLabel[],
    []
  )

  const labelOptions = useMemo(() => ["all", ...supplierLabelEnum], [supplierLabelEnum])
  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter(
        (supplier) =>
          (selectedLabel === "all" || supplier.label === selectedLabel) &&
          (selectedSuppliers.length === 0 || selectedSuppliers.includes(supplier.id))
      ),
    [selectedLabel, selectedSuppliers, suppliers]
  )
  const supplierTotalsById = useMemo(() => {
    const totals = new Map<string, { total: number; count: number }>()
    invoices.forEach((invoice) => {
      const supplierId = invoice.supplierId
      if (!supplierId) return
      if (selectedLabel !== "all") {
        const supplier = suppliersById.get(supplierId)
        if (!supplier || supplier.label !== selectedLabel) return
      }
      if (selectedSuppliers.length && !selectedSuppliers.includes(supplierId)) return
      if (supplierRange.start || supplierRange.end) {
        if (!invoice.date) return
        const date = new Date(invoice.date)
        if (Number.isNaN(date.getTime())) return
        if (supplierRange.start && date < supplierRange.start) return
        if (supplierRange.end && date > supplierRange.end) return
      }
      const current = totals.get(supplierId) ?? { total: 0, count: 0 }
      current.total += invoice.totalHt
      current.count += 1
      totals.set(supplierId, current)
    })
    return totals
  }, [invoices, selectedLabel, selectedSuppliers, supplierRange.end, supplierRange.start, suppliersById])
  const supplierExpenses = useMemo(
    () =>
      filteredSuppliers
        .map((supplier) => {
          const totals = supplierTotalsById.get(supplier.id) ?? { total: 0, count: 0 }
          return {
            id: supplier.id,
            name: supplier.name,
            label: supplier.label ?? "OTHER",
            totalHT: totals.total,
            invoices: totals.count,
          }
        })
        .sort((a, b) => b.totalHT - a.totalHT),
    [filteredSuppliers, supplierTotalsById]
  )
  const totalSupplierHT = useMemo(
    () => supplierExpenses.reduce((sum, supplier) => sum + supplier.totalHT, 0),
    [supplierExpenses]
  )
  const supplierOptionsDetailed = useMemo(
    () =>
      suppliers
        .filter((supplier) => selectedLabel === "all" || supplier.label === selectedLabel)
        .map((supplier) => ({
          value: supplier.id,
          label: supplier.name,
        })),
    [selectedLabel, suppliers]
  )
  const filteredSupplierInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const supplierId = invoice.supplierId
        if (!supplierId) return false
        if (selectedLabel !== "all") {
          const supplier = suppliersById.get(supplierId)
          if (!supplier || supplier.label !== selectedLabel) return false
        }
        if (selectedSuppliers.length && !selectedSuppliers.includes(supplierId)) return false
        if (supplierRange.start || supplierRange.end) {
          if (!invoice.date) return false
          const date = new Date(invoice.date)
          if (Number.isNaN(date.getTime())) return false
          if (supplierRange.start && date < supplierRange.start) return false
          if (supplierRange.end && date > supplierRange.end) return false
        }
        return true
      }),
    [invoices, selectedLabel, selectedSuppliers, supplierRange.end, supplierRange.start, suppliersById]
  )

  useEffect(() => {
    if (selectedLabel === "all") return
    setSelectedSuppliers((prev) =>
      {
        const next = prev.filter((id) => {
          const sup = supplierExpenses.find((s) => s.id === id)
          return sup ? sup.label === selectedLabel : false
        })
        if (next.length === prev.length && next.every((value, index) => value === prev[index])) {
          return prev
        }
        return next
      }
    )
  }, [selectedLabel, supplierExpenses])
  const supplierSeries = useMemo(
    () => buildSupplierSeries(filteredSupplierInvoices, supplierInterval),
    [filteredSupplierInvoices, supplierInterval]
  )
  const latestVariations = useMemo(
    () =>
      variations
        .map((variation) => {
          const master = variation.masterArticleId
            ? masterArticlesById.get(variation.masterArticleId)
            : undefined
          const supplier = master?.supplierId ? suppliersById.get(master.supplierId) : undefined
          return {
            id: variation.id,
            article: master?.name ?? "Article",
            supplier: supplier?.name ?? "Fournisseur",
            change: formatVariationLabel(variation.percentage),
            isDown: (variation.percentage ?? 0) < 0,
          }
        })
        .slice(0, 10),
    [masterArticlesById, suppliersById, variations]
  )


  useEffect(() => {
    const root = variationsTickerRef.current
    const track = variationsTickerTrackRef.current
    if (!root || !track) return

    let frameId = 0
    let lastTime = 0
    const speed = 18
    let offset = 0

    track.style.willChange = "transform"

    const tick = (time: number) => {
      if (!lastTime) lastTime = time
      const delta = time - lastTime
      lastTime = time

      const loopWidth = track.scrollWidth / 2
      if (loopWidth > 0 && loopWidth > root.clientWidth) {
        offset -= (delta * speed) / 1000
        if (Math.abs(offset) >= loopWidth) {
          offset = 0
        }
        track.style.transform = `translateX(${offset}px)`
      }

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    return () => {
      window.cancelAnimationFrame(frameId)
      track.style.willChange = ""
      track.style.transform = ""
    }
  }, [latestVariations.length])

  useEffect(() => {
    const root = suppliersScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowSuppliersBottomFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
    }

    updateBottomFade()
    viewport.addEventListener("scroll", updateBottomFade, { passive: true })
    window.addEventListener("resize", updateBottomFade)

    return () => {
      viewport.removeEventListener("scroll", updateBottomFade)
      window.removeEventListener("resize", updateBottomFade)
    }
  }, [])

  useEffect(() => {
    const root = productsListRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowProductsListFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
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
    <div className="flex w-full items-start justify-start">
      <div className="w-full min-w-0 space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Analyses produits</h1>
            <p className="text-sm text-muted-foreground">Vue générale des coûts et économies potentielles.</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Tabs defaultValue="general" className="w-full sm:w-auto">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="general" className="flex-1 px-4">
                  Général
                </TabsTrigger>
                <TabsTrigger
                  value="detail"
                  className="flex-1 px-4"
                  onClick={() => navigate("/dashboard/analytics/products/detail")}
                >
                  Détails
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-1">
                <CardTitle>Dépenses fournisseurs</CardTitle>
                <p className="text-sm text-muted-foreground">Évolution des dépenses fournisseurs hors taxes.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Label</p>
                  <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filtrer par label" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-muted-foreground">
                        Tous les labels
                      </SelectItem>
                      {labelOptions
                        .filter((label) => label !== "all")
                        .map((label) => (
                          <SelectItem key={label} value={label}>
                            {supplierLabelDisplay[label as keyof typeof supplierLabelDisplay] ?? label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 min-w-[240px]">
                  <p className="text-xs font-medium text-muted-foreground">Fournisseur</p>
                  <MultipleCombobox
                    className="max-w-xs"
                    placeholder="Sélectionner des fournisseurs"
                    items={supplierOptionsDetailed}
                    value={selectedSuppliers}
                    onChange={(values) => setSelectedSuppliers(values)}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <DoubleDatePicker
                  displayFormat="long"
                  showSeparator
                  minDate={minSupplierDate}
                  startDate={supplierRange.start}
                  endDate={supplierRange.end}
                  onChange={({ startDate, endDate }) => setSupplierRange({ start: startDate, end: endDate })}
                />
                <div className="flex flex-col gap-2 self-start">
                  <div className="h-[16px]" aria-hidden />
                  <Tabs value={supplierInterval} onValueChange={(value) => setSupplierInterval(value as IntervalKey)}>
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
            </div>

            <div className="grid gap-6 lg:grid-cols-12 mt-6">
              {filteredSuppliers.length ? (
                <>
                  <div className="lg:col-span-8">
                    {supplierSeries.length ? (
                      <AreaChartBlock
                        key={`suppliers-${supplierInterval}-${supplierRange.start?.toISOString() ?? ""}-${supplierRange.end?.toISOString() ?? ""}`}
                        data={supplierSeries}
                        variant="bare"
                        showHeader={false}
                        showDatePicker={false}
                        showIntervalTabs={false}
                        enableZoom={false}
                        defaultInterval={supplierInterval}
                        startDate={supplierRange.start}
                        endDate={supplierRange.end}
                        areaColor="var(--chart-1)"
                        height={300}
                        margin={{ left: -10 }}
                        tooltipLabel="Dépenses HT"
                        valueFormatter={(value) => euroFormatter.format(value)}
                        tooltipValueFormatter={(value) => euroFormatter.format(value)}
                        xTickFormatter={(_date, label) => label}
                        yTickFormatter={(value) => euroFormatter0.format(Math.round(value))}
                        yTickCount={4}
                      />
                    ) : (
                      <div className="flex h-[300px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                        Aucune dépense sur la période sélectionnée.
                      </div>
                    )}
                  </div>
                  <div className="lg:col-span-4">
                    <div className="flex h-[300px] flex-col overflow-hidden ">
                      <div className="relative flex-1 min-h-0" ref={suppliersScrollRef}>
                        <ScrollArea className="h-full">
                          <div className="space-y-2">
                            {supplierExpenses.map((supplier) => (
                              <div
                                key={supplier.id}
                                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/60 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{supplier.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {supplierLabelDisplay[supplier.label as keyof typeof supplierLabelDisplay] ?? supplier.label}
                                    {" · "}
                                    {supplier.invoices} factures
                                  </p>
                                </div>
                                <div className="text-right">
                                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium hover:bg-red-500/10">
                                    {euroFormatter.format(supplier.totalHT)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        <div
                          className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                            showSuppliersBottomFade ? "opacity-100" : "opacity-0"
                          }`}
                        />
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Total hors taxes</span>
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-medium">
                          {euroFormatter.format(totalSupplierHT)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-12 flex h-[300px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                  Aucun résultat pour ces filtres.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background">
          <CardContent className="p-4">
            <CardDescription>Dernières variations</CardDescription>
            {latestVariations.length ? (
              <div className="mt-1 overflow-hidden">
                <div ref={variationsTickerRef} className="relative h-12 w-full overflow-hidden">
                  <div
                    ref={variationsTickerTrackRef}
                    className="absolute left-0 top-0 flex w-max items-center gap-3 pr-6"
                  >
                    {[...latestVariations, ...latestVariations].map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex min-w-[220px] flex-none items-end justify-between gap-3 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                              item.isDown ? "border-green-200/60" : "border-red-200/60"
                            }`}
                          >
                            {item.isDown ? (
                              <ArrowDown className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowUp className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="space-y-0">
                            <p className="text-sm text-foreground">{item.article}</p>
                            <p className="text-xs text-muted-foreground">{item.supplier}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${item.isDown ? "text-green-500" : "text-red-500"}`}>
                          {item.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex h-12 items-center justify-center text-sm text-muted-foreground">
                Aucune variation récente sur la période.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle>
                  {productTop === "all" ? "Produits consommés" : `Top ${productTop} des produits consommés`}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Suivi des produits les plus consommés et de leurs écarts de prix.
                </p>
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <MultipleCombobox
                  className="max-w-xs"
                  placeholder="Tous les fournisseurs"
                  items={productSuppliersOptions}
                  value={productSelectedSuppliers}
                  onChange={setProductSelectedSuppliers}
                />
                <Select value={productTop} onValueChange={(val) => setProductTop(val as typeof productTop)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productTopOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              {filteredProductItems.length === 0 ? (
                <div className="col-span-12 flex min-h-[320px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                  Aucun résultat pour ces filtres.
                </div>
              ) : (
                <>
                  <div className="lg:col-span-5">
                    <div className="relative h-[360px] flex flex-col" ref={productsListRef}>
                      <div className="mb-2 flex items-center justify-between pl-3 pr-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() =>
                              setProductSort((prev) => (prev === "default" ? "asc" : prev === "asc" ? "desc" : "default"))
                            }
                            aria-label="Trier par statut de prix"
                          >
                            {productSort === "default" ? (
                              <ArrowUpDown className="h-4 w-4" />
                            ) : productSort === "asc" ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                          </Button>
                          <span>Produits</span>
                        </div>
                        <span>Valeur consomm&eacute;e /mois</span>
                      </div>
                      <ScrollArea className="flex-1">
                        <div className="space-y-2 pr-4">
                          {filteredProductItems.map((item) => {
                            const isSelected = selectedProduct?.id === item.id
                            const delta = item.deltaPct
                            const battery =
                              delta >= 10
                                ? { icon: BatteryLow, color: "text-red-500", ring: "border-red-200/60" }
                                : delta >= 2
                                  ? { icon: BatteryLow, color: "text-orange-500", ring: "border-orange-200/60" }
                                  : delta >= 0
                                    ? { icon: BatteryMedium, color: "text-yellow-500", ring: "border-yellow-200/60" }
                                    : { icon: BatteryFull, color: "text-green-500", ring: "border-green-200/60" }
                            return (
                              <button
                                key={item.id}
                                className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left shadow-sm transition-all ${
                                  isSelected
                                    ? "border-primary/40 bg-muted/60 origin-left scale-[1.02] shadow-md z-10"
                                    : "bg-muted/40 hover:bg-muted/60"
                                }`}
                                onClick={(event) => {
                                  setSelectedProductId(item.id)
                                  scrollProductItemToTop(event.currentTarget)
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${battery.ring}`}
                                  >
                                    <battery.icon className={`h-4 w-4 ${battery.color}`} />
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-sm font-semibold">
                                    {euroFormatterWith2.format(item.consumption)}
                                  </Badge>
                                  {isSelected ? <ArrowRight className="h-4 w-4 text-muted-foreground" /> : null}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </ScrollArea>
                      <div
                        className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                          showProductsListFade ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="lg:col-span-7">
                    {selectedProduct ? (
                      <Card className="h-full shadow-none">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const delta = selectedProduct.deltaPct
                              if (delta >= 10) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-sm font-semibold hover:bg-red-500/10">
                                        <BatteryLow className="mr-1 h-[18px] w-[18px]" />
                                        Critique
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                      Critique : votre prix est bien au-dessus du prix moyen du marché.
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              }
                              if (delta >= 2) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-sm font-semibold hover:bg-orange-500/10">
                                        <BatteryLow className="mr-1 h-[18px] w-[18px]" />
                                        A surveiller
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                      A surveiller : votre prix est au-dessus du prix moyen du marché.
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              }
                              if (delta >= 0) {
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-sm font-semibold hover:bg-yellow-500/10">
                                        <BatteryMedium className="mr-1 h-[18px] w-[18px]" />
                                        Bon
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                      Bon : votre prix est proche du prix moyen du marché.
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              }
                              return (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-sm font-semibold hover:bg-green-500/10">
                                      <BatteryFull className="mr-1 h-[18px] w-[18px]" />
                                      Excellent
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                                    Excellent : votre prix est en dessous du prix moyen du marché.
                                  </TooltipContent>
                                </Tooltip>
                              )
                            })()}
                          </div>

                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-semibold leading-tight">{selectedProduct.name}</p>
                              <p className="text-sm text-muted-foreground">{selectedProduct.supplier}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <p className="text-xs font-medium text-muted-foreground">Prix moyen payé</p>
                              <Badge variant="secondary" className="text-base font-semibold">
                                {euroFormatterWith2.format(selectedProduct.paidPrice)}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-md bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground">Quantité vendue</p>
                                  <p className="mt-2 text-sm font-semibold">{selectedProduct.qty}</p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                                Quantité vendue de ce produit sur le mois dernier
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-md bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground">Décallage avec le marché</p>
                                  <p
                                    className={`mt-2 text-sm font-semibold flex flex-wrap items-center gap-1 ${
                                      selectedProduct.deltaPct >= 10
                                        ? "text-red-500"
                                        : selectedProduct.deltaPct >= 2
                                          ? "text-orange-500"
                                          : selectedProduct.deltaPct >= 0
                                            ? "text-yellow-500"
                                            : "text-green-500"
                                    }`}
                                  >
                                    {selectedProduct.deltaPct > 0 ? (
                                      <ArrowUp className="h-4 w-4" />
                                    ) : (
                                      <ArrowDown className="h-4 w-4" />
                                    )}
                                    <span>
                                      {selectedProduct.deltaPct >= 0 ? "+" : "-"}
                                      {Math.abs(selectedProduct.deltaPct).toFixed(1)}%
                                    </span>
                                  </p>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                                {`Différence entre le montant que vous payé par ${selectedProduct.unit ?? "unité"} et le prix payé par vos concurrents.`}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="rounded-md bg-muted/30 p-3">
                                  <p className="text-xs text-muted-foreground">Prix payé par le marché</p>
                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold">
                                      {euroFormatterWith2.format(selectedProduct.marketPrice)}
                                    </p>
                                    <p
                                      className={`text-sm font-semibold ${
                                        selectedProduct.deltaPct >= 10
                                          ? "text-red-500"
                                          : selectedProduct.deltaPct >= 2
                                            ? "text-orange-500"
                                            : selectedProduct.deltaPct >= 0
                                              ? "text-yellow-500"
                                              : "text-green-500"
                                      }`}
                                    >
                                      <span className="text-muted-foreground">(</span>
                                      {selectedProduct.deltaPct >= 0 ? "+" : "-"}
                                      {diffNumberFormatter.format(
                                        Math.abs(selectedProduct.paidPrice - selectedProduct.marketPrice)
                                      )}
                                      €<span className="text-xs text-muted-foreground font-medium">/{selectedProduct.unit ?? "unité"}</span>
                                      <span className="text-muted-foreground">)</span>
                                    </p>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" sideOffset={6} className="max-w-[260px] text-wrap text-center">
                                {`Le marché paye en moyenne ce prix par ${selectedProduct.unit ?? "unité"} avec une volatilité entre ${euroFormatterWith2.format(
                                  Math.min(selectedProduct.marketTrend.from, selectedProduct.marketTrend.to)
                                )} et ${euroFormatterWith2.format(
                                  Math.max(selectedProduct.marketTrend.from, selectedProduct.marketTrend.to)
                                )}.`}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="-mt-1 flex flex-col items-center">
                              <Avatar className="h-22 w-22">
                                <AvatarImage src={ConsultantAvatar} alt="Consultant" className="bg-transparent" />
                              </Avatar>
                              <p className="text-xs text-muted-foreground -mt-2">Le consultant</p>
                            </div>
                            <div className="flex-1 rounded-md border bg-muted/20 p-3 space-y-3">
                              {selectedProductEconomy ? (
                                <>
                                  {selectedProductEconomy.mode === "saving" ? (
                                    <>
                                      <p className="text-sm">
                                        Vous payez le{" "}
                                        <span className="underline decoration-1 underline-offset-2">
                                          {selectedProductEconomy.productName}
                                        </span>{" "}
                                        <span className="text-green-500">
                                          {selectedProductEconomy.amountPerUnit}
                                        </span>{" "}
                                        de moins par {selectedProductEconomy.unitLabel} que le marché, bravo à vous,
                                        continuez comme ça.
                                      </p>
                                      <p className="text-sm text-muted-foreground">{selectedProductEconomy.line2}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm">
                                        {selectedProductEconomy.line1Lead}
                                        <span className="underline decoration-1 underline-offset-2">
                                          {selectedProductEconomy.productName}
                                        </span>
                                        {selectedProductEconomy.line1Trail}
                                        <span className="text-green-500">
                                          {selectedProductEconomy.monthly}/mois
                                        </span>
                                        {selectedProductEconomy.line1Tail}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedProductEconomy.line2Prefix}
                                        <span className="font-medium text-red-500">
                                          {selectedProductEconomy.yearly}/an
                                        </span>
                                        {selectedProductEconomy.line2Suffix}
                                      </p>
                                    </>
                                  )}
                                </>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                        Aucun produit sélectionné.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
