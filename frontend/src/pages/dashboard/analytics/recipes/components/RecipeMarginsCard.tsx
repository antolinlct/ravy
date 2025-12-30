import { useEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { DoubleDatePicker } from "@/components/blocks/double-datepicker"
import { AreaChart as AreaChartBlock, type IntervalKey } from "@/components/blocks/area-chart"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RecipeMarginItem } from "../types"

export type RecipeMarginsCardProps = {
  averageMargin: number | null
  marginPeriodDelta: number | null
  marginPeriodDeltaLabel: string
  categoryOptions: Array<{ value: string; label: string }>
  filteredSubCategories: Array<{ value: string; label: string }>
  selectedCategory: string
  selectedSubCategory: string
  onCategoryChange: (value: string) => void
  onSubCategoryChange: (value: string) => void
  marginRange: { start?: Date; end?: Date }
  onRangeChange: (range: { start?: Date; end?: Date }) => void
  minMarginDate: Date
  marginInterval: IntervalKey
  onIntervalChange: (value: IntervalKey) => void
  marginSeries: Array<{ date?: Date | string; value?: number }>
  margins: RecipeMarginItem[]
  marginSortBy: "margin" | "name"
  marginSortDirection: "asc" | "desc"
  onSortByChange: (value: "margin" | "name") => void
  onSortDirectionChange: (value: "asc" | "desc") => void
  euroFormatter: Intl.NumberFormat
}

export const RecipeMarginsCard = ({
  averageMargin,
  marginPeriodDelta,
  marginPeriodDeltaLabel,
  categoryOptions,
  filteredSubCategories,
  selectedCategory,
  selectedSubCategory,
  onCategoryChange,
  onSubCategoryChange,
  marginRange,
  onRangeChange,
  minMarginDate,
  marginInterval,
  onIntervalChange,
  marginSeries,
  margins,
  marginSortBy,
  marginSortDirection,
  onSortByChange,
  onSortDirectionChange,
  euroFormatter,
}: RecipeMarginsCardProps) => {
  const suppliersScrollRef = useRef<HTMLDivElement | null>(null)
  const [showSuppliersBottomFade, setShowSuppliersBottomFade] = useState(false)

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
  }, [margins.length])

  const handleCategoryChange = (value: string) => {
    if (value === "__all__") {
      onCategoryChange("__all__")
      onSubCategoryChange("__all__")
      return
    }
    onCategoryChange(value)
    onSubCategoryChange("__all__")
  }

  const handleSubCategoryChange = (value: string) => {
    if (value === "__all__") {
      onSubCategoryChange("__all__")
      return
    }
    onSubCategoryChange(value)
  }

  return (
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
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
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
              <Select value={selectedSubCategory} onValueChange={handleSubCategoryChange}>
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
              onChange={({ startDate, endDate }) => onRangeChange({ start: startDate, end: endDate })}
            />
            <div className="flex flex-col gap-2 self-start">
              <div className="h-[16px]" aria-hidden />
              <Tabs value={marginInterval} onValueChange={(value) => onIntervalChange(value as IntervalKey)}>
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
          {margins.length ? (
            <>
              <div className="lg:col-span-8">
                {marginSeries.length ? (
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
                ) : (
                  <div className="flex h-[340px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                    Aucune marge disponible pour cette période.
                  </div>
                )}
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
                            onSortByChange("name")
                            onSortDirectionChange("asc")
                            return
                          }
                          onSortDirectionChange(marginSortDirection === "asc" ? "desc" : "asc")
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
                            onSortByChange("margin")
                            onSortDirectionChange("desc")
                            return
                          }
                          onSortDirectionChange(marginSortDirection === "desc" ? "asc" : "desc")
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
                        {margins.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-lg border bg-muted/60 px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Coût de production:{" "}
                                <span className="text-red-500">
                                  {typeof item.costPerPortion === "number"
                                    ? euroFormatter.format(item.costPerPortion)
                                    : "--"}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary" className="text-sm font-medium">
                                {typeof item.marginPercent === "number"
                                  ? `${item.marginPercent.toFixed(2).replace(".", ",")}%`
                                  : "--"}
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
  )
}
