import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDown, ArrowRight, ArrowUp, Check, ChevronsUpDown, Info } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function RecipeAnalyticsDetailPage() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState("__all__")
  const [selectedSubCategory, setSelectedSubCategory] = useState("__all__")
  const [recipeSearchOpen, setRecipeSearchOpen] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState("")
  const [costInterval, setCostInterval] = useState<IntervalKey>("week")
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
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )
  const categoryOptions = useMemo(
    () => [
      { value: "entrees", label: "Entrées" },
      { value: "plats", label: "Plats" },
      { value: "desserts", label: "Desserts" },
      { value: "boissons", label: "Boissons" },
    ],
    []
  )
  const subCategoryOptions = useMemo(
    () => [
      { value: "salades", label: "Salades", category: "entrees" },
      { value: "snacking", label: "Snacking", category: "entrees" },
      { value: "viandes", label: "Viandes", category: "plats" },
      { value: "poissons", label: "Poissons", category: "plats" },
      { value: "vegetarien", label: "Végétarien", category: "plats" },
      { value: "tartes", label: "Tartes", category: "desserts" },
      { value: "glaces", label: "Glaces", category: "desserts" },
      { value: "softs", label: "Softs", category: "boissons" },
    ],
    []
  )
  const recipes = useMemo(
    () => [
      { id: "rec-1", label: "Salade Caesar", category: "entrees", subCategory: "salades", lastModified: "2026-02-06", isActive: true, isSellable: true },
      { id: "rec-2", label: "Burger maison", category: "plats", subCategory: "viandes", lastModified: "2026-02-11", isActive: true, isSellable: true },
      { id: "rec-3", label: "Filet de poulet", category: "plats", subCategory: "viandes", lastModified: "2026-02-02", isActive: true, isSellable: true },
      { id: "rec-4", label: "Pavé de saumon", category: "plats", subCategory: "poissons", lastModified: "2026-01-29", isActive: true, isSellable: true },
      { id: "rec-5", label: "Tarte citron", category: "desserts", subCategory: "tartes", lastModified: "2026-02-09", isActive: true, isSellable: true },
      { id: "rec-6", label: "Glace vanille", category: "desserts", subCategory: "glaces", lastModified: "2026-01-22", isActive: false, isSellable: false },
      { id: "rec-7", label: "Limonade maison", category: "boissons", subCategory: "softs", lastModified: "2026-02-05", isActive: true, isSellable: false },
    ],
    []
  )
  const filteredSubCategoryOptions = useMemo(() => {
    if (selectedCategory === "__all__") return []
    return subCategoryOptions.filter((opt) => opt.category === selectedCategory)
  }, [selectedCategory, subCategoryOptions])
  const recipesByCategoryAndSub = useMemo(() => {
    return recipes.filter((recipe) => {
      if (!recipe.isActive) return false
      if (selectedCategory !== "__all__" && recipe.category !== selectedCategory) return false
      if (selectedSubCategory !== "__all__" && recipe.subCategory !== selectedSubCategory) return false
      return true
    })
  }, [recipes, selectedCategory, selectedSubCategory])
  const selectedRecipe = useMemo(
    () => recipes.find((recipe) => recipe.id === selectedRecipeId),
    [recipes, selectedRecipeId]
  )
  const selectionSeed = useMemo(() => {
    if (!selectedRecipeId) return 0
    return selectedRecipeId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  }, [selectedRecipeId])
  const costSeriesBase = useMemo<AreaChartPoint[]>(() => {
    const points: AreaChartPoint[] = []
    const start = new Date("2025-01-01")
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const base = 0.19 + i * 0.00005
      const wave = Math.sin(i / 20) * 0.015
      const jitter = (i % 6) * 0.0008
      const value = Number((base + wave + jitter).toFixed(3))
      points.push({ date: d, value })
    }
    return points
  }, [])
  const costFactor = useMemo(() => (selectionSeed ? 1 + (selectionSeed % 5) * 0.01 : 1), [selectionSeed])
  const marginMetricLabel = "Marge"
  const unitCostSeries = useMemo(() => {
    if (!selectedRecipeId) return []
    return costSeriesBase.map((point) => ({
      ...point,
      value: point.value ? Number((point.value * costFactor).toFixed(3)) : point.value,
    }))
  }, [costSeriesBase, costFactor, selectedRecipeId])
  const costPerPortionSeriesBase = useMemo<AreaChartPoint[]>(() => {
    const points: AreaChartPoint[] = []
    const start = new Date("2025-01-01")
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const base = 1.6 + i * 0.0004
      const wave = Math.sin(i / 24) * 0.08
      const jitter = (i % 7) * 0.01
      const value = Number((base + wave + jitter).toFixed(2))
      points.push({ date: d, value })
    }
    return points
  }, [])
  const costPerPortionSeries = useMemo(() => {
    if (!selectedRecipeId) return []
    const factor = 1 + (selectionSeed % 6) * 0.015
    return costPerPortionSeriesBase.map((point) => ({
      ...point,
      value: point.value ? Number((point.value * factor).toFixed(2)) : point.value,
    }))
  }, [costPerPortionSeriesBase, selectionSeed, selectedRecipeId])
  const filteredCostPerPortionSeries = useMemo(() => {
    if (!costPerPortionSeries.length) return []
    return costPerPortionSeries.filter((point) => {
      if (!point.date) return false
      const date = point.date instanceof Date ? point.date : new Date(point.date)
      if (Number.isNaN(date.getTime())) return false
      if (analysisRange.start && date < analysisRange.start) return false
      if (analysisRange.end && date > analysisRange.end) return false
      return true
    })
  }, [analysisRange.end, analysisRange.start, costPerPortionSeries])
  const costSeries = useMemo(() => {
    if (!selectedRecipeId) return []
    return unitCostSeries
  }, [selectedRecipeId, unitCostSeries])
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
  const targetMargin = useMemo(() => {
    if (!selectedRecipeId) return null
    return 0.78 + (selectionSeed % 6) * 0.015
  }, [selectedRecipeId, selectionSeed])
  const targetMarginDelta = useMemo(() => {
    if (!selectedRecipeId) return null
    return 0.12 + (selectionSeed % 8) * 0.01
  }, [selectedRecipeId, selectionSeed])
  const categoryMargin = useMemo(() => {
    if (!selectedRecipeId) return null
    return 0.8 + (selectionSeed % 5) * 0.015
  }, [selectedRecipeId, selectionSeed])
  const categoryMarginDelta = useMemo(() => {
    if (!selectedRecipeId) return null
    return 0.1 + (selectionSeed % 6) * 0.01
  }, [selectedRecipeId, selectionSeed])
  const monthlySales = useMemo(() => {
    if (!selectedRecipeId) return null
    return 12 + (selectionSeed % 10) * 1.5
  }, [selectedRecipeId, selectionSeed])
  const monthlySalesDelta = useMemo(() => {
    if (!selectedRecipeId) return null
    return -(2 + (selectionSeed % 6))
  }, [selectedRecipeId, selectionSeed])
  const monthlyRevenue = useMemo(() => {
    if (!monthlySales) return null
    const averageTicket = 10 + (selectionSeed % 6) * 1.6
    return monthlySales * averageTicket
  }, [monthlySales, selectionSeed])
  const monthlyRevenueShare = useMemo(() => {
    if (!monthlyRevenue) return null
    return 0.001 + (selectionSeed % 4) * 0.0006
  }, [monthlyRevenue, selectionSeed])
  const pointsFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  )
  const formatPoints = (value: number) => {
    const sign = value > 0 ? "+" : ""
    return `${sign}${pointsFormatter.format(value)} pts`
  }
  const ingredientRows = useMemo(
    () => [
      { id: "ing-1", name: "Filet de poulet", type: "ARTICLE", quantity: 0.18, unit: "kg", weightShare: 0.32, costStart: 0.82, costEnd: 0.91, impactEuro: 0.09 },
      { id: "ing-2", name: "Crème fraîche", type: "ARTICLE", quantity: 0.06, unit: "L", weightShare: 0.12, costStart: 0.24, costEnd: 0.22, impactEuro: -0.02 },
      { id: "ing-3", name: "Champignons", type: "ARTICLE", quantity: 0.08, unit: "kg", weightShare: 0.1, costStart: 0.18, costEnd: 0.19, impactEuro: 0.01 },
      { id: "ing-4", name: "Beurre", type: "ARTICLE", quantity: 0.04, unit: "kg", weightShare: 0.08, costStart: 0.12, costEnd: 0.15, impactEuro: 0.03 },
      { id: "ing-5", name: "Sauce maison", type: "SUBRECIPE", portions: 2, weightShare: 0.2, costStart: 0.28, costEnd: 0.3, impactEuro: 0.02 },
      { id: "ing-6", name: "Assaisonnement", type: "FIXED", weightShare: 0.05, costStart: 0.05, costEnd: 0.05, impactEuro: 0 },
    ],
    []
  )
  const sortedIngredientRows = useMemo(() => {
    const rank: Record<string, number> = {
      ARTICLE: 0,
      SUBRECIPE: 1,
      FIXED: 2,
    }
    return [...ingredientRows].sort((a, b) => {
      const typeDiff = (rank[a.type] ?? 99) - (rank[b.type] ?? 99)
      if (typeDiff !== 0) return typeDiff
      if (a.type === "ARTICLE" && b.type === "ARTICLE") {
        return (b.weightShare ?? 0) - (a.weightShare ?? 0)
      }
      return 0
    })
  }, [ingredientRows])
  const analysisStartLabel = useMemo(() => {
    if (!analysisRange.start) return "--"
    return analysisRange.start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisRange.start])
  const analysisEndLabel = useMemo(() => {
    if (!analysisRange.end) return "--"
    return analysisRange.end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }, [analysisRange.end])
  const analysisEndLabelLong = useMemo(() => {
    if (!analysisRange.end) return "--"
    const formatted = analysisRange.end.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    return formatted.replace(".", "").replace(/\s(\d{4})$/, ", $1")
  }, [analysisRange.end])
  const today = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  }, [])
  const analysisEndDate = useMemo(() => {
    if (!analysisRange.end) return null
    const date = new Date(analysisRange.end)
    if (Number.isNaN(date.getTime())) return null
    date.setHours(0, 0, 0, 0)
    return date
  }, [analysisRange.end])
  const isEndCurrentOrFuture = analysisEndDate ? analysisEndDate >= today : true
  const marginTitle = useMemo(() => {
    if (isEndCurrentOrFuture) return "Marge actuelle"
    return `Marge au ${analysisEndLabelLong}`
  }, [analysisEndLabelLong, isEndCurrentOrFuture])
  const costTitle = useMemo(() => {
    if (isEndCurrentOrFuture) return "Coût d'achat actuel"
    return `Coût d'achat au ${analysisEndLabelLong}`
  }, [analysisEndLabelLong, isEndCurrentOrFuture])
  const costPerPortionDelta = useMemo(() => {
    if (filteredCostPerPortionSeries.length < 2) return null
    const firstPoint = filteredCostPerPortionSeries[0]
    const lastPoint = filteredCostPerPortionSeries[filteredCostPerPortionSeries.length - 1]
    const firstValue = typeof firstPoint?.value === "number" ? firstPoint.value : null
    const lastValue = typeof lastPoint?.value === "number" ? lastPoint.value : null
    if (firstValue === null || lastValue === null || firstValue === 0) return null
    return (lastValue - firstValue) / firstValue
  }, [filteredCostPerPortionSeries])
  const costPerPortionDeltaLabel = useMemo(() => {
    if (costPerPortionDelta === null) return "--"
    const sign = costPerPortionDelta > 0 ? "+" : ""
    return `${sign}${percentFormatter.format(costPerPortionDelta)}`
  }, [costPerPortionDelta, percentFormatter])
  const costPerPortionLatest = useMemo(() => {
    const lastPoint = filteredCostPerPortionSeries[filteredCostPerPortionSeries.length - 1]
    return typeof lastPoint?.value === "number" ? lastPoint.value : null
  }, [filteredCostPerPortionSeries])
  const hasSelection = Boolean(selectedRecipeId)
  const showMarginCard = !hasSelection || selectedRecipe?.isSellable !== false

  useEffect(() => {
    setCostZoomRange({})
  }, [analysisRange.end, analysisRange.start, selectedRecipeId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Analyses recettes</h1>
          <p className="text-sm text-muted-foreground">
            Analysez la performance de vos recettes en détail.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="detail" className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger
                value="general"
                className="flex-1 px-4"
                onClick={() => navigate("/dashboard/analytics/recipes")}
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
            <CardTitle>Sélectionnez une recette à analyser</CardTitle>
          </div>
          <div className="grid w-full items-start gap-4 grid-cols-[180px_220px_260px_340px]">
              <div className="flex flex-col gap-2 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Catégorie</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    if (value === "__all__") {
                      setSelectedCategory("__all__")
                      setSelectedSubCategory("__all__")
                      setSelectedRecipeId("")
                      return
                    }
                    setSelectedCategory(value)
                    setSelectedSubCategory("__all__")
                    setSelectedRecipeId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="__all__"
                      className="text-muted-foreground focus:text-accent-foreground"
                    >
                      Toutes les catégories
                    </SelectItem>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                <Label className="text-xs font-medium text-muted-foreground">Sous-catégorie</Label>
                <Select
                  value={selectedSubCategory}
                  onValueChange={(value) => {
                    if (value === "__all__") {
                      setSelectedSubCategory("__all__")
                      setSelectedRecipeId("")
                      return
                    }
                    setSelectedSubCategory(value)
                    setSelectedRecipeId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les sous-catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="__all__"
                      className="text-muted-foreground focus:text-accent-foreground"
                    >
                      Toutes les sous-catégories
                    </SelectItem>
                    {selectedCategory === "__all__" ? (
                      <SelectItem value="__none__" disabled>
                        Aucune sous-catégorie disponible
                      </SelectItem>
                    ) : (
                      filteredSubCategoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 min-w-[200px]">
                <Label className="text-xs font-medium text-muted-foreground">Recette</Label>
                <Popover open={recipeSearchOpen} onOpenChange={setRecipeSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={recipeSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedRecipeId
                        ? recipesByCategoryAndSub.find((opt) => opt.id === selectedRecipeId)?.label
                        : "Sélectionnez une recette"}
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher une recette..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucune recette trouvée.</CommandEmpty>
                          <CommandGroup>
                          {recipesByCategoryAndSub.map((opt) => (
                            <CommandItem
                              key={opt.id}
                              value={opt.label}
                              onSelect={() => {
                                setSelectedRecipeId(selectedRecipeId === opt.id ? "" : opt.id)
                                setRecipeSearchOpen(false)
                              }}
                            >
                              {opt.label}
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  selectedRecipeId === opt.id ? "opacity-100" : "opacity-0"
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
        </CardContent>
      </Card>

      {showMarginCard ? (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>
                  Marge de la recette {selectedRecipe?.label ?? "-"}
                </CardTitle>
              </div>
            </div>

            {!hasSelection ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                Sélectionnez une recette pour afficher l&apos;analyse.
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
                      tooltipLabel={marginMetricLabel}
                      valueFormatter={(value) => euroFormatter.format(value)}
                      tooltipValueFormatter={(value) => euroFormatter.format(value)}
                      xTickFormatter={(_date, label) => label}
                      yTickFormatter={(value) => euroFormatter.format(value)}
                      yTickCount={4}
                    />
                  </div>
                  <div className="lg:col-span-4 flex h-full flex-col justify-end">
                    <div className="lg:border-l lg:pl-6">
                      <div className="mb-4 rounded-md border bg-card p-3">
                        <p className="text-base font-semibold text-primary">{marginTitle}</p>
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <span className="text-lg font-semibold tabular-nums">
                            {latestCostValue !== null ? percentFormatter.format(latestCostValue) : "--"}
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
                              <p className="text-xs text-muted-foreground">Marge ciblé</p>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary" className="text-sm font-semibold">
                                  {targetMargin !== null ? percentFormatter.format(targetMargin) : "--"}
                                </Badge>
                                <span className="text-sm font-medium text-green-500">
                                  {targetMarginDelta !== null ? formatPoints(targetMarginDelta) : "--"}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                            Décallage avec la marge cible de votre établissement.
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-md bg-muted/30 p-3">
                              <p className="text-xs text-muted-foreground">Marge catégorie</p>
                              <div className="mt-2 flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {categoryMargin !== null ? percentFormatter.format(categoryMargin) : "--"}
                                </span>
                                <span className="text-sm font-medium text-green-500">
                                  {categoryMarginDelta !== null ? formatPoints(categoryMarginDelta) : "--"}
                                </span>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                            Marge moyenne des recettes avec la même catégorie.
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-md bg-muted/30 p-3 space-y-1.5">
                              <p className="text-xs text-muted-foreground">Ventes mensuelles</p>
                              <p className="text-sm font-semibold">
                                {monthlySales !== null ? `${Math.round(monthlySales)} ventes` : "--"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {monthlySalesDelta !== null ? `${monthlySalesDelta} ventes` : "--"}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[240px] text-wrap text-center">
                            Ventes de cette recette le dernier mois.
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="rounded-md bg-muted/30 p-3 space-y-1.5">
                              <p className="text-xs text-muted-foreground">CA généré</p>
                              <p className="text-sm font-semibold">
                                {monthlyRevenue !== null ? euroFormatter.format(monthlyRevenue) : "--"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {monthlyRevenueShare !== null
                                  ? `${percentFormatter.format(monthlyRevenueShare)} des revenus`
                                  : "--"}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                            Chiffre d&apos;affaires généré par cette recette sur le dernier mois.
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {hasSelection ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <CardTitle>
              Coût d&apos;achat de la recette {selectedRecipe?.label ?? "-"}
            </CardTitle>
            <AreaChartBlock
              data={filteredCostPerPortionSeries}
              variant="bare"
              showHeader
              title={null}
              subtitle={null}
              showPrimaryValue={false}
              showDatePicker={false}
              showIntervalTabs
              enableZoom
              defaultInterval="week"
              height={240}
              margin={{ left: -10 }}
              areaColor="var(--chart-2)"
              tooltipLabel="Coût d'achat / portion"
              valueFormatter={(value) => euroFormatter.format(value)}
              tooltipValueFormatter={(value) => euroFormatter.format(value)}
              yTickFormatter={(value) => euroFormatter.format(value)}
              xTickFormatter={(_date, label) => label}
              yTickCount={4}
              actions={
                <div className="flex items-center gap-3">
                  <div className="rounded-md border bg-card px-3 py-2 text-sm font-medium">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{costTitle}</span>
                      <span className="text-base font-semibold">
                        {costPerPortionLatest !== null ? euroFormatter.format(costPerPortionLatest) : "--"}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          costPerPortionDelta !== null && costPerPortionDelta >= 0
                            ? "text-red-500"
                            : "text-green-500"
                        )}
                      >
                        {costPerPortionDeltaLabel}
                      </span>
                    </div>
                  </div>
                </div>
              }
            />
            <div className="rounded-md border">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">
                      Ingrédients
                    </TableHead>
                    <TableHead className="w-24 pr-6">
                      <ColumnHeader
                        label="Poids (%)"
                        tooltip="Part de l'ingrédient dans le coût total par portion de la recette (à la fin de période)."
                      />
                    </TableHead>
                    <TableHead className="w-28 pr-6">
                      <ColumnHeader
                        label={`Coût au ${analysisStartLabel}`}
                        tooltip="Coût d'achat par portion au début de la période sélectionnée."
                      />
                    </TableHead>
                    <TableHead className="w-28 pr-6">
                      <ColumnHeader
                        label={`Coût au ${analysisEndLabel}`}
                        tooltip="Coût d'achat par portion à la fin de la période sélectionnée."
                      />
                    </TableHead>
                    <TableHead className="w-24 pr-6">
                      <ColumnHeader
                        label="Variation"
                        tooltip="Variation du coût par portion de l'ingrédient sur la période."
                      />
                    </TableHead>
                    <TableHead className="w-24">
                      <ColumnHeader
                        label="Impact (€)"
                        tooltip="Impact de l'ingrédient sur le coût total par portion sur la période."
                      />
                    </TableHead>
                    <TableHead className="w-10 text-right" />
                  </TableRow>
                </TableHeader>
              </Table>
              <ScrollArea className="max-h-[450px]">
                <Table className="table-fixed w-full">
                  <TableBody>
                    {sortedIngredientRows.map((row) => {
                      const costStart = row.costStart
                      const costEnd = row.costEnd
                      const costDelta =
                        typeof costStart === "number" && typeof costEnd === "number" && costStart !== 0
                          ? ((costEnd - costStart) / costStart) * 100
                          : null
                      const hasCost = typeof costStart === "number" && typeof costEnd === "number"
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
                          <TableCell className="w-[30%]">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{row.name}</p>
                              {row.type === "FIXED" ? (
                                <p className="text-xs text-muted-foreground">Ingredient fixe</p>
                              ) : row.type === "SUBRECIPE" ? (
                                <p className="text-xs text-muted-foreground">
                                  Sous recettes : {row.portions ?? "--"} portions
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  {row.quantity !== undefined ? row.quantity.toString().replace(".", ",") : "--"}{" "}
                                  {row.unit ?? ""}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="w-24 pr-6 text-sm font-semibold text-muted-foreground">
                            {hasCost && typeof row.weightShare === "number"
                              ? percentFormatter.format(row.weightShare)
                              : "--"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-28 pr-6 text-sm font-semibold",
                              hasCost ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {hasCost ? euroFormatter.format(costStart) : "--"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-28 pr-6 text-sm font-semibold",
                              hasCost ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {hasCost ? euroFormatter.format(costEnd) : "--"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-24 pr-6 text-sm font-semibold",
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
                              "w-24 text-sm font-semibold",
                              hasCost ? impactClass : "text-muted-foreground"
                            )}
                          >
                            {hasCost && hasSignificantImpact
                              ? (
                                <span>
                                  {row.impactEuro >= 0 ? "-" : "+"}
                                  {euroFormatter.format(Math.abs(row.impactEuro))}
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
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
