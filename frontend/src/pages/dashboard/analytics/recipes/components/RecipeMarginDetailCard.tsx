import { ArrowDown, ArrowUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AreaChart as AreaChartBlock, type IntervalKey } from "@/components/blocks/area-chart"
import { cn } from "@/lib/utils"

export type RecipeMarginDetailCardProps = {
  hasSelection: boolean
  selectedRecipeName: string
  filteredMarginSeries: Array<{ date?: Date | string; value?: number }>
  costInterval: IntervalKey
  onIntervalChange: (value: IntervalKey) => void
  analysisRange: { start?: Date; end?: Date }
  onZoomChange: (range: { start?: Date; end?: Date }) => void
  marginTitle: string
  latestMarginValue: number | null
  marginDelta: number | null
  marginDeltaIsPositive: boolean
  marginDeltaLabel: string
  targetMargin: number | null
  targetMarginDelta: number | null
  categoryMargin: number | null
  categoryMarginDelta: number | null
  monthlySales: number | null
  monthlySalesDelta: number | null
  monthlyRevenue: number | null
  monthlyRevenueShare: number | null
  formatPoints: (value: number) => string
  euroFormatter: Intl.NumberFormat
  percentFormatter: Intl.NumberFormat
}

export const RecipeMarginDetailCard = ({
  hasSelection,
  selectedRecipeName,
  filteredMarginSeries,
  costInterval,
  onIntervalChange,
  analysisRange,
  onZoomChange,
  marginTitle,
  latestMarginValue,
  marginDelta,
  marginDeltaIsPositive,
  marginDeltaLabel,
  targetMargin,
  targetMarginDelta,
  categoryMargin,
  categoryMarginDelta,
  monthlySales,
  monthlySalesDelta,
  monthlyRevenue,
  monthlyRevenueShare,
  formatPoints,
  euroFormatter,
  percentFormatter,
}: RecipeMarginDetailCardProps) => {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Marge de la recette {selectedRecipeName}</CardTitle>
          </div>
        </div>

        {!hasSelection ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
            Sélectionnez une recette pour afficher l&apos;analyse.
          </div>
        ) : filteredMarginSeries.length ? (
          <>
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <AreaChartBlock
                  data={filteredMarginSeries}
                  variant="bare"
                  showHeader
                  showPrimaryValue={false}
                  title={null}
                  showDatePicker={false}
                  showIntervalTabs
                  defaultInterval={costInterval}
                  onIntervalChange={(value) => onIntervalChange(value as IntervalKey)}
                  startDate={analysisRange.start}
                  endDate={analysisRange.end}
                  onZoomChange={onZoomChange}
                  height={260}
                  margin={{ left: -10 }}
                  tooltipLabel="Marge"
                  valueFormatter={(value) => percentFormatter.format(value)}
                  tooltipValueFormatter={(value) => percentFormatter.format(value)}
                  xTickFormatter={(_date, label) => label}
                  yTickFormatter={(value) => percentFormatter.format(value)}
                  yTickCount={4}
                />
              </div>
              <div className="lg:col-span-4 flex h-full flex-col justify-end">
                <div className="lg:border-l lg:pl-6">
                  <div className="mb-4 rounded-md border bg-card p-3">
                    <p className="text-base font-semibold text-primary">{marginTitle}</p>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span className="text-lg font-semibold tabular-nums">
                        {latestMarginValue !== null ? percentFormatter.format(latestMarginValue) : "--"}
                      </span>
                      {marginDelta === null ? (
                        <span className="text-sm text-muted-foreground">--</span>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-sm font-medium",
                            marginDeltaIsPositive ? "text-green-500" : "text-red-500"
                          )}
                        >
                          {marginDeltaIsPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                          {marginDeltaLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-base font-semibold text-primary">Performances</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="rounded-md bg-muted/30 p-3">
                          <p className="text-xs text-muted-foreground">Marge ciblée</p>
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
                        Écart entre la marge actuelle et la marge moyenne de l&apos;établissement.
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
                        Marge moyenne des recettes de la même catégorie.
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
                        Données de vente à connecter ultérieurement.
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
                        Données de CA à connecter ultérieurement.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
            Aucune marge disponible pour cette période.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
