import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { AreaChart as AreaChartBlock, type AreaChartPoint, type IntervalKey } from "@/components/blocks/area-chart"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function RecipeAnalyticsPage() {
  const navigate = useNavigate()
  const variationsTickerRef = useRef<HTMLDivElement | null>(null)
  const variationsTickerTrackRef = useRef<HTMLDivElement | null>(null)
  const suppliersScrollRef = useRef<HTMLDivElement | null>(null)
  const [showSuppliersBottomFade, setShowSuppliersBottomFade] = useState(false)
  const activeRecipesCount = 23
  const inactiveRecipesCount = 4
  const categoryOptions = useMemo(
    () => [
      { value: "entrees", label: "Entrées" },
      { value: "plats", label: "Plats" },
      { value: "desserts", label: "Desserts" },
      { value: "boissons", label: "Boissons" },
    ],
    []
  )
  const filterSubCategoryByCategory = useMemo(
    () => ({
      entrees: [
        { value: "sale", label: "Salé" },
        { value: "vegetarien", label: "Végétarien" },
      ],
      plats: [
        { value: "sale", label: "Salé" },
        { value: "vegetarien", label: "Végétarien" },
      ],
      desserts: [{ value: "sucre", label: "Sucré" }],
      boissons: [{ value: "sans-alcool", label: "Sans alcool" }],
    }),
    []
  )
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("__all__")
  const [marginInterval, setMarginInterval] = useState<IntervalKey>("week")
  const [marginSortBy, setMarginSortBy] = useState<"margin" | "name">("margin")
  const [marginSortDirection, setMarginSortDirection] = useState<"desc" | "asc">("desc")
  const minMarginDate = useMemo(() => new Date("2022-01-01"), [])
  const [marginRange, setMarginRange] = useState<{ start?: Date; end?: Date }>(() => ({
    start: new Date("2025-01-01"),
    end: new Date("2025-12-31"),
  }))
  const marginItems = useMemo(
    () => [
      { id: "r1", name: "Crème caramel", category: "desserts", subCategory: "sucre", margin: 86.04, cost: "0,67 €" },
      { id: "r2", name: "Burger Tradition", category: "plats", subCategory: "sale", margin: 87.69, cost: "2,00 €" },
      { id: "r3", name: "Tarte citron", category: "desserts", subCategory: "sucre", margin: 86.14, cost: "1,01 €" },
      { id: "r4", name: "Focaccia avocat et saumon", category: "entrees", subCategory: "sale", margin: 85.87, cost: "1,79 €" },
      { id: "r5", name: "Guacamole et Focaccia", category: "entrees", subCategory: "vegetarien", margin: 85.28, cost: "0,94 €" },
      { id: "r6", name: "Brownie chocolat", category: "desserts", subCategory: "sucre", margin: 86.92, cost: "0,85 €" },
      { id: "r7", name: "Cocktail maison", category: "boissons", subCategory: "sans-alcool", margin: 78.4, cost: "1,20 €" },
    ],
    []
  )
  const marginTrendBase = useMemo<AreaChartPoint[]>(() => {
    const points: AreaChartPoint[] = []
    const start = new Date("2025-01-01")
    for (let i = 0; i < 120; i += 1) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const base = 82.2 + i * 0.02
      const wave = Math.sin(i / 10) * 0.6
      const jitter = (i % 5) * 0.05
      points.push({
        date: d,
        value: Number((base + wave + jitter).toFixed(2)),
      })
    }
    return points
  }, [])
  const filteredSubCategories = useMemo(() => {
    if (selectedCategory === "__all__") return []
    return filterSubCategoryByCategory[selectedCategory as keyof typeof filterSubCategoryByCategory] ?? []
  }, [filterSubCategoryByCategory, selectedCategory])
  const filteredMargins = useMemo(() => {
    const filtered = marginItems
      .filter((item) => selectedCategory === "__all__" || item.category === selectedCategory)
      .filter((item) => selectedSubCategory === "__all__" || item.subCategory === selectedSubCategory)

    return filtered.sort((a, b) => {
      if (marginSortBy === "name") {
        const direction = marginSortDirection === "asc" ? 1 : -1
        return a.name.localeCompare(b.name, "fr-FR", { sensitivity: "base" }) * direction
      }
      return marginSortDirection === "desc" ? b.margin - a.margin : a.margin - b.margin
    })
  }, [marginItems, marginSortBy, marginSortDirection, selectedCategory, selectedSubCategory])
  const averageMargin = useMemo(() => {
    if (!filteredMargins.length) return null
    const sum = filteredMargins.reduce((acc, item) => acc + item.margin, 0)
    return sum / filteredMargins.length
  }, [filteredMargins])
  const marginSeries = useMemo(() => {
    const start = marginRange.start
    const end = marginRange.end
    return marginTrendBase.filter((point) => {
      const d = point.date instanceof Date ? point.date : new Date(point.date ?? "")
      if (!d || Number.isNaN(d.getTime())) return false
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    })
  }, [marginTrendBase, marginRange.end, marginRange.start])
  const marginPeriodDelta = useMemo(() => {
    if (marginSeries.length < 2) return null
    const firstPoint = marginSeries[0]
    const lastPoint = marginSeries[marginSeries.length - 1]
    if (!firstPoint || !lastPoint) return null
    const first = typeof firstPoint.value === "number" ? firstPoint.value : null
    const last = typeof lastPoint.value === "number" ? lastPoint.value : null
    if (first === null || last === null || first === 0) return null
    return ((last - first) / first) * 100
  }, [marginSeries])
  const marginPeriodDeltaLabel = useMemo(() => {
    if (marginPeriodDelta === null) return "--"
    const sign = marginPeriodDelta > 0 ? "+" : ""
    return `${sign}${marginPeriodDelta.toFixed(2).replace(".", ",")}%`
  }, [marginPeriodDelta])
  const recipeKpis = useMemo(
    () => [
      { label: "Cout d'achat moyen", value: "1,25 €", delta: 1.8 },
      { label: "Prix de vente moyen", value: "12,91 €", delta: 0.6 },
      { label: "Marge moyenne (€)", value: "10,10 €", delta: -0.4 },
      { label: "Marge moyenne (%)", value: "84,76%", delta: -0.9 },
    ],
    []
  )
  const recipeMarginVariations = useMemo(
    () => [
      { recipe: "Burger maison", margin: "62%", change: "+2,3%" },
      { recipe: "Salade Caesar", margin: "58%", change: "-1,1%" },
      { recipe: "Pates bolognaise", margin: "46%", change: "+0,7%" },
      { recipe: "Tarte citron", margin: "64%", change: "+1,9%" },
      { recipe: "Filet de poulet", margin: "52%", change: "-0,6%" },
      { recipe: "Mousse chocolat", margin: "71%", change: "+3,1%" },
      { recipe: "Poisson du jour", margin: "49%", change: "-1,8%" },
      { recipe: "Croque monsieur", margin: "55%", change: "+0,4%" },
    ],
    []
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
  }, [])

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Analyses recettes</h1>
          <p className="text-sm text-muted-foreground">
            Vue générale des performances et coûts de vos recettes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="general" className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="general" className="flex-1 px-4">
                Général
              </TabsTrigger>
              <TabsTrigger
                value="detail"
                className="flex-1 px-4"
                onClick={() => navigate("/dashboard/analytics/recipes/detail")}
              >
                Détails
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="bg-background">
            <CardContent className="space-y-5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle>Variations de vos recettes sur 30 jours</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  <span>Recettes actives</span>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {activeRecipesCount}
                  </Badge>
                  <span>-</span>
                  <span>Recettes inactives</span>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {inactiveRecipesCount}
                  </Badge>
                </CardDescription>
              </div>
              <div className="overflow-hidden">
                <div ref={variationsTickerRef} className="relative h-12 w-full overflow-hidden">
                  <div
                    ref={variationsTickerTrackRef}
                    className="absolute left-0 top-0 flex w-max items-center gap-3 pr-6"
                  >
                    {[...recipeMarginVariations, ...recipeMarginVariations].map((item, index) => {
                      const isDown = item.change.startsWith("-")
                      return (
                        <div
                          key={`${item.recipe}-${index}`}
                          className="flex min-w-[220px] flex-none items-end justify-between gap-3 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm ${
                                isDown ? "border-red-200/60" : "border-green-200/60"
                              }`}
                            >
                              {isDown ? (
                                <ArrowDown className="h-4 w-4 text-red-500" />
                              ) : (
                                <ArrowUp className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="space-y-0">
                              <p className="text-sm text-foreground">{item.recipe}</p>
                              <p className="text-xs text-muted-foreground">Marge actuel : {item.margin}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${isDown ? "text-red-500" : "text-green-500"}`}>
                            {item.change}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {recipeKpis.map((item) => {
                  const isUp = item.delta >= 0
                  const deltaLabel = `${isUp ? "+" : ""}${item.delta.toFixed(1).replace(".", ",")}%`
                  return (
                    <Card key={item.label} className="border-0 bg-muted/40 rounded-md shadow-none">
                      <CardContent className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-lg font-semibold tabular-nums">{item.value}</span>
                            <div className="flex items-center gap-1.5">
                              {isUp ? (
                                <ArrowUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-semibold ${isUp ? "text-green-500" : "text-red-500"}`}>
                                {deltaLabel}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="max-w-[280px] text-center">
          Variations des 30 derniers jours, uniquement pour les recettes actives et vendables.
        </TooltipContent>
      </Tooltip>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle>Marges moyennes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Suivi de l&apos;évolution des marges moyennes sur la période sélectionnée.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">Moyenne</span>
              <div className="text-lg font-semibold">
                {averageMargin !== null ? `${averageMargin.toFixed(2).replace(".", ",")}%` : "--"}
              </div>
              <div
                className={`text-xs font-semibold ${
                  marginPeriodDelta === null
                    ? "text-muted-foreground"
                    : marginPeriodDelta >= 0
                      ? "text-green-500"
                      : "text-red-500"
                }`}
              >
                {marginPeriodDeltaLabel}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-start gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Catégorie</p>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    if (value === "__all__") {
                      setSelectedCategory("__all__")
                      setSelectedSubCategory("__all__")
                      return
                    }
                    setSelectedCategory(value)
                    setSelectedSubCategory("__all__")
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="text-muted-foreground">
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
              <div className="flex flex-col gap-2 min-w-[200px]">
                <p className="text-xs font-medium text-muted-foreground">Sous-catégorie</p>
                <Select
                  value={selectedSubCategory}
                  onValueChange={(value) => {
                    if (value === "__all__") {
                      setSelectedSubCategory("__all__")
                      return
                    }
                    setSelectedSubCategory(value)
                  }}
                >
                  <SelectTrigger className="min-w-[200px]">
                    <SelectValue placeholder="Toutes les sous-catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="text-muted-foreground">
                      Toutes les sous-catégories
                    </SelectItem>
                    {selectedCategory === "__all__" ? (
                      <SelectItem value="__none__" disabled>
                        Aucune sous-catégorie disponible
                      </SelectItem>
                    ) : (
                      filteredSubCategories.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-start gap-3">
              <DoubleDatePicker
                displayFormat="long"
                showSeparator
                minDate={minMarginDate}
                startDate={marginRange.start}
                endDate={marginRange.end}
                onChange={({ startDate, endDate }) => setMarginRange({ start: startDate, end: endDate })}
              />
              <div className="flex flex-col gap-2 self-start">
                <div className="h-[16px]" aria-hidden />
                <Tabs value={marginInterval} onValueChange={(value) => setMarginInterval(value as IntervalKey)}>
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

          <div className="mt-6 grid gap-6 lg:grid-cols-12">
            {filteredMargins.length ? (
              <>
                <div className="lg:col-span-8">
                  <AreaChartBlock
                    key={`margins-${marginInterval}-${marginRange.start?.toISOString() ?? ""}-${marginRange.end?.toISOString() ?? ""}`}
                    data={marginSeries}
                    variant="bare"
                    showHeader={false}
                    showDatePicker={false}
                    showIntervalTabs={false}
                    enableZoom={false}
                    defaultInterval={marginInterval}
                    startDate={marginRange.start}
                    endDate={marginRange.end}
                    areaColor="var(--chart-1)"
                    height={340}
                    margin={{ left: -10 }}
                    tooltipLabel="Marge moyenne"
                    valueFormatter={(value) => `${value.toFixed(2).replace(".", ",")}%`}
                    tooltipValueFormatter={(value) => `${value.toFixed(2).replace(".", ",")}%`}
                    xTickFormatter={(_date, label) => label}
                    yTickFormatter={(value) => `${value.toFixed(0).replace(".", ",")}%`}
                    yTickCount={4}
                  />
                </div>
                <div className="lg:col-span-4">
                  <div className="flex h-[340px] flex-col overflow-hidden ">
                  <div className="flex items-center justify-between px-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      Recette
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground"
                        onClick={() => {
                          if (marginSortBy !== "name") {
                            setMarginSortBy("name")
                            setMarginSortDirection("asc")
                            return
                          }
                          setMarginSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
                        }}
                        aria-label="Trier par recette"
                      >
                        {marginSortBy !== "name" ? (
                          <ArrowUpDown className="h-3 w-3" />
                        ) : marginSortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )}
                      </Button>
                    </span>
                    <span className="flex items-center gap-1">
                      Marge
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 text-muted-foreground"
                        onClick={() => {
                          if (marginSortBy !== "margin") {
                            setMarginSortBy("margin")
                            setMarginSortDirection("desc")
                            return
                          }
                          setMarginSortDirection((prev) => (prev === "desc" ? "asc" : "desc"))
                        }}
                        aria-label="Trier par marge"
                      >
                        {marginSortBy !== "margin" ? (
                          <ArrowUpDown className="h-3 w-3" />
                        ) : marginSortDirection === "desc" ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUp className="h-3 w-3" />
                        )}
                      </Button>
                    </span>
                  </div>
                  <div className="relative mt-3 flex-1 min-h-0" ref={suppliersScrollRef}>
                    <ScrollArea className="h-full">
                        <div className="space-y-2">
                          {filteredMargins.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 rounded-lg border bg-muted/60 px-3 py-2"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Cout de production : <span className="text-red-500">{item.cost}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary" className="text-sm font-medium">
                                  {item.margin.toFixed(2).replace(".", ",")}%
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

    </div>
  )
}
