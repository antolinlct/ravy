import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowDown, ArrowUp, ChevronRight, HandCoins, Trash2 } from "lucide-react"
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { AreaChart as AreaChartBlock, type AreaChartPoint, type IntervalKey } from "@/components/blocks/area-chart"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ProductAnalyticsPage() {
  const navigate = useNavigate()
  const variationsScrollRef = useRef<HTMLDivElement | null>(null)
  const productsScrollRef = useRef<HTMLDivElement | null>(null)
  const [showVariationsBottomFade, setShowVariationsBottomFade] = useState(false)
  const [showProductsRightFade, setShowProductsRightFade] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>("all")
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all")
  const [interval, setInterval] = useState<IntervalKey>("month")
  const [supplierRange, setSupplierRange] = useState<{ start?: Date; end?: Date }>(() => ({
    start: new Date("2025-01-01"),
    end: new Date("2025-12-31"),
  }))
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
  const monthlyEuroFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  )
  const supplierExpenses = useMemo(
    () =>
      [
        { id: "sysco", name: "Sysco France", label: "Épicerie", totalHT: 45281.6, invoices: 113 },
        { id: "distriporc", name: "Distriporc", label: "Viandes", totalHT: 17441.42, invoices: 64 },
        { id: "dc-plateforme", name: "DC PLATEFORME", label: "Épicerie", totalHT: 12816.07, invoices: 16 },
        { id: "episaveurs", name: "EpiSaveurs groupe pomona", label: "Épicerie", totalHT: 9018.91, invoices: 25 },
        { id: "relais-or", name: "Relais d'Or", label: "Viandes", totalHT: 6858.49, invoices: 21 },
        { id: "metro", name: "Metro", label: "Boissons", totalHT: 5420.77, invoices: 18 },
      ] as const,
    []
  )

  const supplierTrendBase = useMemo<AreaChartPoint[]>(
    () => [
      { label: "Jan. 25", value: 19374.51, date: "2025-01-01" },
      { label: "Fév. 25", value: 14458.93, date: "2025-02-01" },
      { label: "Mar. 25", value: 16511.48, date: "2025-03-01" },
      { label: "Avr. 25", value: 14979.53, date: "2025-04-01" },
      { label: "Mai 25", value: 12730.48, date: "2025-05-01" },
      { label: "Juin 25", value: 14761.87, date: "2025-06-01" },
      { label: "Juil. 25", value: 8420.35, date: "2025-07-01" },
      { label: "Sep. 25", value: 1263.17, date: "2025-09-01" },
      { label: "Déc. 25", value: 12, date: "2025-12-01" },
    ],
    []
  )
  const supplierWeights = useMemo<Record<string, number>>(
    () => ({
      sysco: 0.45,
      distriporc: 0.2,
      "dc-plateforme": 0.12,
      episaveurs: 0.09,
      "relais-or": 0.08,
      metro: 0.06,
    }),
    []
  )
  const labelOptions = useMemo(() => ["all", ...new Set(supplierExpenses.map((s) => s.label))], [supplierExpenses])
  const supplierOptions = useMemo(() => ["all", ...supplierExpenses.map((s) => s.id)], [supplierExpenses])
  const filteredSuppliers = useMemo(
    () =>
      supplierExpenses
        .filter(
          (supplier) =>
            (selectedLabel === "all" || supplier.label === selectedLabel) &&
            (selectedSupplier === "all" || supplier.id === selectedSupplier)
        )
        .sort((a, b) => b.totalHT - a.totalHT),
    [supplierExpenses, selectedLabel, selectedSupplier]
  )
  const totalSupplierHT = useMemo(
    () => filteredSuppliers.reduce((sum, supplier) => sum + supplier.totalHT, 0),
    [filteredSuppliers]
  )
  const activeSupplierIds = useMemo(() => filteredSuppliers.map((s) => s.id), [filteredSuppliers])
  const activeWeight = useMemo(() => {
    if (selectedSupplier !== "all") {
      return supplierWeights[selectedSupplier] ?? 1
    }
    const sum = activeSupplierIds.reduce((acc, id) => acc + (supplierWeights[id] ?? 0), 0)
    return sum || 1
  }, [activeSupplierIds, selectedSupplier, supplierWeights])
  const supplierSeries = useMemo(() => {
    const start = supplierRange.start
    const end = supplierRange.end
    return supplierTrendBase
      .map((point) => ({
        ...point,
        value: typeof point.value === "number" ? point.value * activeWeight : point.value,
      }))
      .filter((point) => {
        const d = point.date instanceof Date ? point.date : new Date(point.date ?? "")
        if (!d || Number.isNaN(d.getTime())) return false
        if (start && d < start) return false
        if (end && d > end) return false
        return true
      })
  }, [supplierTrendBase, activeWeight, supplierRange.start, supplierRange.end])

  const latestVariations = [
    { article: "Eau gazeuse 33cl", supplier: "Sysco France", change: "+2,3%" },
    { article: "Filet de poulet", supplier: "Transgourmet", change: "-1,4%" },
    { article: "Beurre AOP 250g", supplier: "France Boissons", change: "+0,9%" },
    { article: "Frites surgelées", supplier: "Brake", change: "-2,1%" },
    { article: "Café moulu 1kg", supplier: "Metro", change: "+1,8%" },
    { article: "Huile d'olive 5L", supplier: "Transgourmet", change: "-0,7%" },
    { article: "Steak haché 15%", supplier: "Sysco France", change: "+3,2%" },
    { article: "Vin rouge AOP", supplier: "France Boissons", change: "-1,9%" },
    { article: "Sucre 5kg", supplier: "Metro", change: "+0,5%" },
    { article: "Lait UHT 1L", supplier: "Brake", change: "-1,2%" },
  ]

  const overpricedProducts = [
    {
      id: "p-1",
      name: "Filet de poulet (origine France) 1kg",
      supplier: "Transgourmet",
      unitPaid: 8.9,
      unitMarket: 8.2,
      monthlyQty: 64,
      unit: "kg",
    },
    {
      id: "p-2",
      name: "Eau gazeuse 33cl (pack de 24)",
      supplier: "Sysco France",
      unitPaid: 0.48,
      unitMarket: 0.39,
      monthlyQty: 420,
      unit: "u",
    },
    {
      id: "p-3",
      name: "Beurre AOP 250g",
      supplier: "France Boissons",
      unitPaid: 2.25,
      unitMarket: 1.95,
      monthlyQty: 120,
      unit: "u",
    },
    {
      id: "p-4",
      name: "Café moulu 1kg (arabica)",
      supplier: "Metro",
      unitPaid: 12.4,
      unitMarket: 11.2,
      monthlyQty: 18,
      unit: "kg",
    },
    {
      id: "p-5",
      name: "Frites surgelées 2,5kg",
      supplier: "Brake",
      unitPaid: 6.5,
      unitMarket: 5.95,
      monthlyQty: 52,
      unit: "kg",
    },
    {
      id: "p-6",
      name: "Huile d'olive 5L",
      supplier: "Transgourmet",
      unitPaid: 36.9,
      unitMarket: 33.5,
      monthlyQty: 6,
      unit: "l",
    },
    {
      id: "p-7",
      name: "Steak haché 15% 10kg",
      supplier: "Sysco France",
      unitPaid: 89,
      unitMarket: 82.5,
      monthlyQty: 5,
      unit: "kg",
    },
    {
      id: "p-8",
      name: "Sucre 5kg",
      supplier: "Metro",
      unitPaid: 5.9,
      unitMarket: 5.2,
      monthlyQty: 14,
      unit: "kg",
    },
  ] as const

  const totalMonthlySavings = overpricedProducts.reduce((sum, item) => {
    const unitDiff = item.unitPaid - item.unitMarket
    return sum + Math.max(0, unitDiff) * item.monthlyQty
  }, 0)

  useEffect(() => {
    const root = variationsScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateBottomFade = () => {
      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight
      setShowVariationsBottomFade(maxScrollTop > 0 && viewport.scrollTop < maxScrollTop - 4)
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
    const root = productsScrollRef.current
    if (!root) return

    const viewport = root.querySelector<HTMLElement>("[data-radix-scroll-area-viewport]")
    if (!viewport) return

    const updateRightFade = () => {
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
      setShowProductsRightFade(maxScrollLeft > 0 && viewport.scrollLeft < maxScrollLeft - 4)
    }
    updateRightFade()

    const onWheel = (event: WheelEvent) => {
      if (viewport.scrollWidth <= viewport.clientWidth) return
      if (event.ctrlKey) return

      // Always map vertical wheel movement to horizontal scroll on this block.
      // This avoids "inconsistent" feel where some wheel events end up scrolling the page.
      let delta = event.deltaY
      if (!delta) delta = event.deltaX
      if (!delta) return

      // Keep a "classic" and consistent feel: just normalize deltaMode to pixels.
      // deltaMode: 0=pixels, 1=lines, 2=pages
      if (event.deltaMode === 1) {
        delta *= 16
      } else if (event.deltaMode === 2) {
        delta *= viewport.clientWidth
      }

      delta *= 0.8

      if (event.cancelable) event.preventDefault()
      const maxScrollLeft = viewport.scrollWidth - viewport.clientWidth
      const nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, viewport.scrollLeft + delta))
      viewport.scrollLeft = nextScrollLeft
    }

    viewport.addEventListener("scroll", updateRightFade, { passive: true })
    root.addEventListener("wheel", onWheel, { passive: false, capture: true })

    return () => {
      viewport.removeEventListener("scroll", updateRightFade)
      root.removeEventListener("wheel", onWheel, { capture: true })
    }
  }, [])

  return (
    <div className="flex w-full items-start justify-start">
      <div className="w-full space-y-4">
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Dépenses fournisseurs HT</CardTitle>
                <CardDescription>Suivi des dépenses et volumes par fournisseur.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={interval} onValueChange={(value: IntervalKey) => setInterval(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Jour</SelectItem>
                    <SelectItem value="week">Semaine</SelectItem>
                    <SelectItem value="month">Mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <div className="flex flex-wrap items-end gap-3 lg:col-span-7">
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground">Label</p>
                  <Select value={selectedLabel} onValueChange={setSelectedLabel}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrer par label" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les labels</SelectItem>
                      {labelOptions
                        .filter((label) => label !== "all")
                        .map((label) => (
                          <SelectItem key={label} value={label}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <p className="text-xs font-medium text-muted-foreground">Fournisseur</p>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Tous les fournisseurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les fournisseurs</SelectItem>
                      {supplierOptions
                        .filter((supplier) => supplier !== "all")
                        .map((supplierId) => {
                          const supplier = supplierExpenses.find((s) => s.id === supplierId)
                          return (
                            <SelectItem key={supplierId} value={supplierId}>
                              {supplier?.name ?? supplierId}
                            </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:col-span-5">
                <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-end lg:justify-end lg:gap-4">
                  <DoubleDatePicker
                    displayFormat="long"
                    showSeparator
                    startDate={supplierRange.start}
                    endDate={supplierRange.end}
                    onChange={({ startDate, endDate }) => setSupplierRange({ start: startDate, end: endDate })}
                  />
                  <div className="flex h-12 items-center rounded-lg border border-green-500/20 bg-green-500/10 px-3 text-green-600">
                    <span className="text-sm font-semibold">Total HT</span>
                    <span className="ml-3 text-lg font-bold">{euroFormatter.format(totalSupplierHT)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <AreaChartBlock
                  key={`suppliers-${interval}`}
                  data={supplierSeries}
                  variant="bare"
                  showHeader={false}
                  showIntervalTabs={false}
                  showDatePicker={false}
                  defaultInterval={interval}
                  startDate={supplierRange.start}
                  endDate={supplierRange.end}
                  areaColor="var(--primary)"
                  height={320}
                  chartClassName="h-[320px]"
                  valueFormatter={(value) => euroFormatter.format(value)}
                  tooltipValueFormatter={(value) => euroFormatter.format(value)}
                  xTickFormatter={(date) =>
                    date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })
                  }
                  yTickFormatter={(value) => euroFormatter.format(value)}
                  yTickCount={6}
                />
              </div>
              <div className="lg:col-span-5">
                <div className="rounded-lg border bg-muted/30">
                  <ScrollArea className="max-h-[360px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-background/60">
                          <TableHead className="text-left">Fournisseur</TableHead>
                          <TableHead className="text-right">Dépenses HT</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="align-top">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{supplier.name}</p>
                                <p className="text-xs text-muted-foreground">{supplier.invoices} factures</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <p className="text-sm font-semibold text-red-500">{euroFormatter.format(supplier.totalHT)}</p>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-10">
          <Card className="md:col-span-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Dernières variations</CardTitle>
                <Button variant="link" className="text-muted-foreground hover:text-destructive p-0 h-6">
                  Tout supprimer
                </Button>
              </div>
              <CardDescription className="mt-1">
                Suivi des articles dont les prix ont récemment varié.
              </CardDescription>
              <div className="relative mt-4">
                <ScrollArea ref={variationsScrollRef} className="h-67">
                  <div className="space-y-2">
                    {latestVariations.map((item) => {
                      const isDown = item.change.startsWith("-")
                      return (
                        <div
                          key={item.article}
                          className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 hover:bg-muted/60 px-3 py-2 shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                                isDown ? "border-green-200/60" : "border-red-200/60"
                              }`}
                            >
                              {isDown ? (
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
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${isDown ? "text-green-500" : "text-red-500"}`}
                            >
                              {item.change}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                    showVariationsBottomFade ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <CardTitle>Produits à optimiser</CardTitle>
                <Button variant="link" className="p-0 h-6 text-muted-foreground hover:text-foreground">
                  Voir l&apos;analyse
                </Button>
              </div>
              <CardDescription className="mt-1">
                Produits dont le prix d&apos;achat est au-dessus du marché.
              </CardDescription>

              <div className="relative mt-4">
                <ScrollArea ref={productsScrollRef} className="w-full" scrollbar="horizontal">
                  <div className="flex w-max gap-3">
                    {overpricedProducts.map((item) => {
                      const unitDiff = item.unitPaid - item.unitMarket
                      const monthlySavings = Math.max(0, unitDiff) * item.monthlyQty
                      const monthlySavingsLabel = `+${monthlyEuroFormatter.format(Math.round(monthlySavings))}€ / mois`
                      const unitDiffLabel = `${unitDiff >= 0 ? "+" : "-"}${diffNumberFormatter.format(
                        Math.abs(unitDiff)
                      )}€`
                      return (
                        <div key={item.id} className="w-44 flex-none">
                          <AspectRatio ratio={4 / 5}>
                            <Link
                              to="/dashboard/analytics/products"
                              aria-label={`Voir l'analyse de ${item.name}`}
                              className="block h-full"
                            >
                              <Card className="h-full w-full bg-muted/40 transition-colors hover:bg-muted/60">
                                <CardContent className="flex h-full flex-col p-4">
                                  <div className="flex flex-col items-start gap-3">
                                    <HandCoins className="h-5" color="#848484" />
                                    <Badge
                                      variant="outline"
                                      className="w-fit border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400 font-medium text-sm"
                                    >
                                      {monthlySavingsLabel}
                                    </Badge>
                                  </div>

                                  <div className="mt-auto">
                                    <div className="min-w-0">
                                      <p className="truncate text-xs text-muted-foreground">{item.supplier}</p>
                                      <p className="mt-1 line-clamp-2 text-sm leading-snug text-foreground">
                                        {item.name}
                                      </p>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-red-500 tabular-nums">
                                          {unitDiffLabel}
                                          <span className=" px-1 text-xs font-normal text-muted-foreground">
                                            / {item.unit.toUpperCase()}
                                          </span>
                                        </p>
                                      </div>
                                      <ChevronRight className="h-4 w-4 flex-none text-muted-foreground" />
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          </AspectRatio>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
                <div
                  className={`pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white/90 via-white/60 to-transparent transition-opacity dark:from-neutral-900/90 dark:via-neutral-900/60 dark:to-transparent ${
                    showProductsRightFade ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>

              <Separator className="my-3" />

              <p className="text-muted-foreground">
                Economies totales possible :{" "}
                <span className="text-green-500">
                  {monthlyEuroFormatter.format(Math.round(totalMonthlySavings))}€
                </span>{" "}
                / mois
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
