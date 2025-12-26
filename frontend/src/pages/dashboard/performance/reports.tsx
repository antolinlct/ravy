import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { ArrowDown, ArrowRight, ArrowUp, Calendar, FilePlus, Info } from "lucide-react"
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function PerformancesReportsPage() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const startYear = 2023
  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => `${startYear + index}`
  )
  const [reportYear, setReportYear] = useState(`${currentYear}`)
  const monthNames = [
    "janvier",
    "fevrier",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "aout",
    "septembre",
    "octobre",
    "novembre",
    "decembre",
  ]
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string; monthIndex: number; year: number }[] = []
    const now = new Date()
    for (let offset = 1; offset <= 6; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const monthIndex = date.getMonth()
      const year = date.getFullYear()
      const label =
        `${monthNames[monthIndex].charAt(0).toUpperCase()}${monthNames[monthIndex].slice(1)}` +
        ` ${year}`
      options.push({
        value: `${year}-${monthIndex}`,
        label,
        monthIndex,
        year,
      })
    }
    return options
  }, [monthNames])
  const [selectedMonthKey, setSelectedMonthKey] = useState("")
  const selectedMonth = monthOptions.find((option) => option.value === selectedMonthKey)
  const yearSuffix = reportYear.slice(-2)
  const [createOpen, setCreateOpen] = useState(false)
  const [financialInputs, setFinancialInputs] = useState({
    laborCost: "",
    headcount: "",
    fixedCosts: "",
    variableCosts: "",
    otherCosts: "",
    revenueFood: "",
    revenueTotal: "",
  })
  const [showValidation, setShowValidation] = useState(false)

  const baseSeries = useMemo(
    () => [
      { shortLabel: "Oct.", fullLabel: "Octobre", monthIndex: 9, revenue: 1025000, expenses: 612400, lastUpdated: "15 Janv. 25" },
      { shortLabel: "Nov.", fullLabel: "Novembre", monthIndex: 10, revenue: 1082000, expenses: 598300, lastUpdated: "15 Janv. 25" },
      { shortLabel: "Dec.", fullLabel: "Decembre", monthIndex: 11, revenue: 987500, expenses: 684200, lastUpdated: "20 Dec. 25" },
      { shortLabel: "Janv.", fullLabel: "Janvier", monthIndex: 0, revenue: 1018000, expenses: 623900, lastUpdated: "12 Fev. 25" },
      { shortLabel: "Fev.", fullLabel: "Fevrier", monthIndex: 1, revenue: 965400, expenses: 575600, lastUpdated: "18 Mars 25" },
      { shortLabel: "Mars", fullLabel: "Mars", monthIndex: 2, revenue: 1123000, expenses: 642800, lastUpdated: "08 Avr. 25" },
    ],
    []
  )

  const reportSeries = useMemo(() => {
    if (reportYear !== `${currentYear}`) {
      return []
    }
    return baseSeries.map((item, index) => ({
      ...item,
      monthShort: `${item.shortLabel} ${yearSuffix}`,
      monthFull: `${item.fullLabel} ${reportYear}`,
      result: item.revenue - item.expenses,
      sortIndex: index,
      monthKey: `${reportYear}-${item.monthIndex}`,
    }))
  }, [baseSeries, currentYear, reportYear, yearSuffix])

  const chartConfig: ChartConfig = {
    revenue: {
      label: "Chiffre d'affaires",
      color: "var(--chart-1)",
    },
    expenses: {
      label: "Coûts",
      color: "var(--chart-2)",
    },
    result: {
      label: "Résultat",
      color: "var(--chart-5)",
    },
  }
  const formatEuro = (value: number) =>
    `${new Intl.NumberFormat("fr-FR").format(value)}\u00a0\u20ac`
  const formatPercent = (value: number) =>
    `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value)}%`
  const reportableRecipes = [
    { id: "aiguillettes", name: "Aiguillettes de poulet", price: 9.0, isActive: true, isSellable: true },
    { id: "andouillette", name: "Andouillette", price: 20.9, isActive: true, isSellable: true },
    { id: "bavette", name: "Bavette de boeuf, frites", price: 21.9, isActive: true, isSellable: true },
    { id: "camembert", name: "Camembert roti", price: 10.0, isActive: true, isSellable: true },
    { id: "bruschetta", name: "Bruschetta", price: 9.0, isActive: true, isSellable: true },
    { id: "burger", name: "Burger Tradition", price: 17.9, isActive: true, isSellable: true },
    { id: "creme", name: "Creme caramel", price: 8.0, isActive: true, isSellable: true },
    { id: "salade", name: "Salade Lyonnaise XL", price: 14.5, isActive: true, isSellable: true },
  ].filter((recipe) => recipe.isActive && recipe.isSellable)
  const selectedMonthLabel = selectedMonth?.label ?? "ce mois"
  const [salesByRecipe, setSalesByRecipe] = useState<Record<string, string>>({})
  const hasAtLeastOneSale = useMemo(
    () => Object.values(salesByRecipe).some((value) => Number(value) >= 1),
    [salesByRecipe]
  )

  const reportSummary = useMemo(() => {
    if (!reportSeries.length) return null
    const first = reportSeries[0]
    const last = reportSeries[reportSeries.length - 1]
    if (!first || !last) return null

    const buildDelta = (start: number, end: number) =>
      start === 0 ? 0 : ((end - start) / start) * 100

    return {
      revenue: {
        current: last.revenue,
        delta: buildDelta(first.revenue, last.revenue),
      },
      expenses: {
        current: last.expenses,
        delta: buildDelta(first.expenses, last.expenses),
      },
      result: {
        current: last.result,
        delta: buildDelta(first.result, last.result),
      },
    }
  }, [reportSeries])

  const reportRows = useMemo(
    () =>
      reportSeries.map((item) => ({
        id: `${item.fullLabel.toLowerCase().replace(/\s+/g, "-")}-${reportYear}`,
        period: `${item.fullLabel} ${reportYear}`,
        lastUpdated: item.lastUpdated,
        revenue: item.revenue,
        expenses: item.expenses,
        result: item.result,
        margin: item.revenue ? (item.result / item.revenue) * 100 : 0,
        sortIndex: item.sortIndex,
        monthKey: item.monthKey,
      })),
    [reportSeries, reportYear]
  )

  const sortedReportRows = useMemo(
    () => [...reportRows].sort((a, b) => b.sortIndex - a.sortIndex),
    [reportRows]
  )
  const existingReportMonths = useMemo(
    () => new Set(reportRows.map((row) => row.monthKey)),
    [reportRows]
  )
  const firstAvailableMonth = useMemo(
    () => monthOptions.find((option) => !existingReportMonths.has(option.value))?.value ?? "",
    [monthOptions, existingReportMonths]
  )

  useEffect(() => {
    const isSelectedAvailable =
      selectedMonthKey &&
      monthOptions.some((option) => option.value === selectedMonthKey) &&
      !existingReportMonths.has(selectedMonthKey)
    if (!isSelectedAvailable) {
      setSelectedMonthKey(firstAvailableMonth)
    }
  }, [existingReportMonths, firstAvailableMonth, monthOptions, selectedMonthKey])
  const isSelectedMonthTaken = selectedMonthKey ? existingReportMonths.has(selectedMonthKey) : false
  const isFinancialComplete = useMemo(
    () => Object.values(financialInputs).every((value) => value.trim() !== ""),
    [financialInputs]
  )
  const isFormReady =
    Boolean(selectedMonthKey) && !isSelectedMonthTaken && isFinancialComplete && hasAtLeastOneSale
  const showFinancialErrors = showValidation && !isFinancialComplete
  const showSalesError = showValidation && !hasAtLeastOneSale
  const handleFinancialInput =
    (key: keyof typeof financialInputs) => (event: ChangeEvent<HTMLInputElement>) => {
      setFinancialInputs((prev) => ({ ...prev, [key]: event.target.value }))
    }
  const handleSalesInput = (recipeId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setSalesByRecipe((prev) => ({ ...prev, [recipeId]: event.target.value }))
  }
  const requiredInputClass = (value: string) =>
    showFinancialErrors && !value.trim() ? "border-destructive focus-visible:ring-destructive" : ""
  const handleCreateAttempt = () => {
    if (!isFormReady) {
      setShowValidation(true)
      toast.error("Création du rapport impossible.")
      return
    }
    toast.success(
      <>
        Le rapport du mois de <span className="font-semibold">{selectedMonthLabel}</span> a été créé.
      </>
    )
    setCreateOpen(false)
    setShowValidation(false)
  }

  const handleReportNavigate = (reportId: string) => {
    navigate(`/dashboard/performance/reports/${reportId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Rapports financiers</h1>
          <p className="text-sm text-muted-foreground">
            Suivez la performance financiere de votre etablissement.
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Info className="h-4 w-4" />
          Comprendre mes rapports
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Performances des derniers mois</CardTitle>
          <Select value={reportYear} onValueChange={setReportYear}>
            <SelectTrigger className="w-[120px] gap-2">
              <Calendar className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {reportSeries.length ? (
            <>
              <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
                <ComposedChart data={reportSeries} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis dataKey="monthShort" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={80}
                    tickFormatter={(value) => formatEuro(Number(value))}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const tooltipLabel = payload[0]?.payload?.monthFull

                      return (
                        <div className="grid min-w-[10rem] gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl">
                          <div className="text-sm text-muted-foreground">{tooltipLabel}</div>
                          <Separator />
                          <div className="grid gap-1.5 text-sm">
                            {payload.map((item) => {
                              const key = `${item.dataKey || item.name || "value"}`
                              const config = chartConfig[key as keyof typeof chartConfig]
                              const indicatorColor = item.color || item.payload?.fill || config?.color
                              const value =
                                typeof item.value === "number" ? formatEuro(item.value) : item.value

                              return (
                                <div key={key} className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 rounded-[2px]"
                                      style={{ backgroundColor: indicatorColor }}
                                    />
                                    <span className="text-muted-foreground">
                                      {config?.label || item.name}
                                    </span>
                                  </div>
                                  <span className="font-medium tabular-nums text-foreground">
                                    {value}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="var(--color-expenses)"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
                  <Area
                    type="monotone"
                    dataKey="result"
                    stroke="var(--color-result)"
                    fill="var(--color-result)"
                    fillOpacity={0.2}
                    strokeWidth={3}
                  />
                </ComposedChart>
              </ChartContainer>

              {reportSummary && (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { label: "Chiffre d'affaires", key: "revenue" as const },
                { label: "Coûts", key: "expenses" as const },
                { label: "Résultat", key: "result" as const },
                  ].map((item) => {
                    const entry = reportSummary[item.key]
                    const isPositive = entry.delta >= 0

                    const deltaLabel = `${isPositive ? "+" : "-"}${formatPercent(Math.abs(entry.delta))}`

                    return (
                      <Card key={item.key} className="h-full rounded-lg border border-border/60">
                        <CardContent className="flex h-full items-center justify-between gap-3 p-4">
                          <div className="flex flex-1 items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">{item.label}</p>
                            {item.key === "revenue" ? (
                              <Badge variant="secondary" className="text-base font-semibold hover:bg-secondary">
                                {formatEuro(entry.current)}
                              </Badge>
                            ) : item.key === "result" ? (
                              <Badge variant="outline" className="text-base font-semibold hover:bg-transparent">
                                {formatEuro(entry.current)}
                              </Badge>
                            ) : (
                              <p className="text-base font-semibold">{formatEuro(entry.current)}</p>
                            )}
                          </div>
                          <div
                            className={`flex items-center gap-1 text-sm font-medium ${
                              isPositive ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            {deltaLabel}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
              Aucune donnee disponible pour {reportYear}.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Rapports financiers</CardTitle>
            <p className="text-sm text-muted-foreground">
              Historique des rapports generes pour votre etablissement.
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <FilePlus className="h-4 w-4" />
                Creer un rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] max-h-[90vh] overflow-y-auto">
              <DialogHeader className="space-y-2">
                <DialogTitle>Créer un rapport financier</DialogTitle>
                <DialogDescription>
                  Sélectionnez la période, puis renseignez les ventes et les données financières.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
                <div className="space-y-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="border-border/60">
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <CardTitle>Période d&apos;activité</CardTitle>
                                <p className="text-sm text-muted-foreground">Mois du rapport</p>
                              </div>
                              <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
                                <SelectTrigger className="w-[160px]">
                                  <SelectValue placeholder="Sélectionner un mois" />
                                </SelectTrigger>
                                <SelectContent>
                                  {monthOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                      disabled={existingReportMonths.has(option.value)}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </CardHeader>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Choisissez le mois de reference du rapport financier.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Card className="border-border/60">
                    <CardHeader className="p-4">
                      <CardTitle>Données financières</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Remplissez les champs suivants pour {selectedMonthLabel}.
                      </p>
                    </CardHeader>
                    <TooltipProvider delayDuration={100}>
                      <CardContent className="space-y-4 p-4 pt-0">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">Main d&apos;oeuvre</Label>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              className={`pr-8 ${requiredInputClass(financialInputs.laborCost)}`}
                              required
                              value={financialInputs.laborCost}
                              onChange={handleFinancialInput("laborCost")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              €
                            </span>
                          </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Montant total des salaires et charges sociales du mois.
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">Nombre ETP</Label>
                          <div className="relative">
                            <Input
                              placeholder="0"
                              className={`pr-24 ${requiredInputClass(financialInputs.headcount)}`}
                              required
                              value={financialInputs.headcount}
                              onChange={handleFinancialInput("headcount")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              personnes
                            </span>
                          </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Nombre equivalent temps plein sur la periode.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Separator />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">Charges fixes</Label>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              className={`pr-8 ${requiredInputClass(financialInputs.fixedCosts)}`}
                              required
                              value={financialInputs.fixedCosts}
                              onChange={handleFinancialInput("fixedCosts")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              €
                            </span>
                          </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Charges fixes liées à votre activité (loyer, intérêts, etc.).
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">Charges variables</Label>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              className={`pr-8 ${requiredInputClass(financialInputs.variableCosts)}`}
                              required
                              value={financialInputs.variableCosts}
                              onChange={handleFinancialInput("variableCosts")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              €
                            </span>
                          </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Charges variables selon votre niveau d&apos;activité (gaz, énergies, etc.).
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2 sm:col-span-2">
                              <Label className="text-xs font-medium text-muted-foreground">Autres charges</Label>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              className={`pr-8 ${requiredInputClass(financialInputs.otherCosts)}`}
                              required
                              value={financialInputs.otherCosts}
                              onChange={handleFinancialInput("otherCosts")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              €
                            </span>
                          </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Autres charges exceptionnelles ou ponctuelles du mois.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Separator />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Chiffre d&apos;affaires solide HT
                              </Label>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              className={`pr-8 ${requiredInputClass(financialInputs.revenueFood)}`}
                              required
                              value={financialInputs.revenueFood}
                              onChange={handleFinancialInput("revenueFood")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              €
                            </span>
                          </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Chiffre d&apos;affaires hors taxes sur vos ventes de plats solides.
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-2">
                              <Label className="text-xs font-medium text-muted-foreground">
                                Chiffre d&apos;affaires total HT
                              </Label>
                          <div className="relative">
                            <Input
                              placeholder="0,00"
                              className={`pr-8 ${requiredInputClass(financialInputs.revenueTotal)}`}
                              required
                              value={financialInputs.revenueTotal}
                              onChange={handleFinancialInput("revenueTotal")}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                              €
                            </span>
                          </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Chiffre d&apos;affaires HT total (solide + liquide).
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                    </TooltipProvider>
                  </Card>
                </div>

                <Card
                  className={`border-border/60 bg-transparent shadow-none ${
                    showSalesError ? "border-destructive" : ""
                  }`}
                >
                  <CardHeader className="space-y-1 p-4 pb-6 pt-6">
                    <CardTitle>Récapitulatif de vos ventes</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Indiquez le nombre de ventes par recette effectuées sur {selectedMonthLabel}.
                    </p>
                  </CardHeader>
                  <CardContent className="overflow-hidden p-0">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-3 text-left">Recette</TableHead>
                          <TableHead className="w-[140px] text-left">Prix de vente</TableHead>
                          <TableHead className="w-[160px] pr-3 text-left">Nombre vendu</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <ScrollArea className="h-[360px]">
                      <Table className="w-full table-fixed">
                        <TableBody>
                          {[...reportableRecipes]
                            .sort((a, b) => a.name.localeCompare(b.name, "fr"))
                            .map((recipe) => (
                            <TableRow key={recipe.id}>
                              <TableCell className="pl-3">
                                <p className="text-sm font-medium">{recipe.name}</p>
                              </TableCell>
                              <TableCell className="w-[140px] text-left">
                                <Badge variant="secondary" className="text-sm font-semibold">
                                  {formatEuro(recipe.price)}
                                </Badge>
                              </TableCell>
                              <TableCell className="w-[160px] pr-3 text-left">
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  min={0}
                                  step={1}
                                  placeholder="Indiquez ici"
                                  className="w-[110px]"
                                  value={salesByRecipe[recipe.id] ?? ""}
                                  onChange={handleSalesInput(recipe.id)}
                                  onKeyDown={(event) => {
                                    if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                                      event.preventDefault()
                                    }
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateAttempt}
                  aria-disabled={!isFormReady}
                  className={!isFormReady ? "cursor-not-allowed opacity-50" : ""}
                >
                  Créer un rapport
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-3 w-[28%]">Periode</TableHead>
                  <TableHead className="w-32 text-left">Chiffre d&apos;affaires</TableHead>
                  <TableHead className="w-28 text-left">Coûts</TableHead>
                  <TableHead className="w-28 text-left">Résultat</TableHead>
                  <TableHead className="w-36 text-left">Marge operationnelle</TableHead>
                  <TableHead className="w-10 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReportRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleReportNavigate(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        handleReportNavigate(row.id)
                      }
                    }}
                  >
                    <TableCell className="pl-3 w-[28%]">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{row.period}</p>
                        <p className="text-xs text-muted-foreground">
                          Derniere modif. : {row.lastUpdated}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge
                        variant="secondary"
                        className="inline-flex min-w-[96px] justify-center text-sm font-semibold"
                      >
                        {formatEuro(row.revenue)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <span className="inline-flex min-w-[96px] justify-start text-sm font-semibold">
                        {formatEuro(row.expenses)}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge
                        variant="outline"
                        className="inline-flex min-w-[96px] justify-center text-sm font-semibold"
                      >
                        {formatEuro(row.result)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left text-sm font-semibold">
                      {formatPercent(row.margin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
                {!sortedReportRows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      Aucun rapport disponible.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
