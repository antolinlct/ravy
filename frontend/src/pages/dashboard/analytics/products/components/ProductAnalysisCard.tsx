import { ArrowDown, ArrowRight, ArrowUp, Info, Wallet } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AreaChart as AreaChartBlock, type IntervalKey } from "@/components/blocks/area-chart"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { RecipeImpactRow } from "../types"

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

export type ProductAnalysisCardProps = {
  hasSelection: boolean
  selectedArticleName: string
  analysisRange: { start?: Date; end?: Date }
  costSeries: Array<{ date?: Date | string; value?: number }>
  costInterval: IntervalKey
  onIntervalChange: (value: IntervalKey) => void
  onZoomChange: (range: { start?: Date; end?: Date }) => void
  costMetric: string
  onCostMetricChange: (value: string) => void
  costMetricTitle: string
  latestCostValue: number | null
  costDelta: number | null
  costDeltaIsPositive: boolean
  costDeltaLabel: string
  avgCost: number | null
  marketCost: number | null
  marketVolatility: { from: number; to: number } | null
  unitLabel: string
  theoreticalConsumption: number | null
  potentialSavings: number | null
  daysSinceLastPurchase: number | null
  supplierShareLabel: string
  supplierMonthlySpend: number | null
  analysisStartLabel: string
  analysisEndLabel: string
  recipesRows: RecipeImpactRow[]
  euroFormatter: Intl.NumberFormat
  euroFormatterNoDecimals: Intl.NumberFormat
}

export const ProductAnalysisCard = ({
  hasSelection,
  selectedArticleName,
  analysisRange,
  costSeries,
  costInterval,
  onIntervalChange,
  onZoomChange,
  costMetric,
  onCostMetricChange,
  costMetricTitle,
  latestCostValue,
  costDelta,
  costDeltaIsPositive,
  costDeltaLabel,
  avgCost,
  marketCost,
  marketVolatility,
  unitLabel,
  theoreticalConsumption,
  potentialSavings,
  daysSinceLastPurchase,
  supplierShareLabel,
  supplierMonthlySpend,
  analysisStartLabel,
  analysisEndLabel,
  recipesRows,
  euroFormatter,
  euroFormatterNoDecimals,
}: ProductAnalysisCardProps) => {
  const sortedRecipesRows = recipesRows

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Analyse du produit {selectedArticleName || "-"}</CardTitle>
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
                {costSeries.length ? (
                  <AreaChartBlock
                    data={costSeries}
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
                    tooltipLabel={costMetric}
                    valueFormatter={(value) => euroFormatter.format(value)}
                    tooltipValueFormatter={(value) => euroFormatter.format(value)}
                    xTickFormatter={(_date, label) => label}
                    yTickFormatter={(value) => euroFormatter.format(value)}
                    yTickCount={4}
                    actions={
                      <Select value={costMetric} onValueChange={onCostMetricChange}>
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
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    }
                  />
                ) : (
                  <div className="flex h-[260px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
                    Aucune donnée disponible sur la période sélectionnée.
                  </div>
                )}
              </div>
              <div className="lg:col-span-4 flex h-full flex-col justify-end">
                <div className="lg:border-l lg:pl-6">
                  <div className="mb-4 rounded-md border bg-card p-3">
                    <p className="text-base font-semibold text-primary">{costMetricTitle}</p>
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
                              {avgCost !== null ? euroFormatter.format(avgCost) : "--"}
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
                            {marketCost !== null ? euroFormatter.format(marketCost) : "--"}{" "}
                            <span className="text-xs text-muted-foreground">/ {unitLabel}</span>
                          </p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} className="max-w-[220px] text-wrap text-center">
                        {marketVolatility
                          ? `Le marché paie en moyenne ce prix par ${unitLabel} avec une volatilité entre ${euroFormatter.format(
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
                            {theoreticalConsumption !== null
                              ? theoreticalConsumption.toFixed(1).replace(".", ",")
                              : "--"}{" "}
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
                Vous n&apos;avez pas commandé chez ce fournisseur depuis {daysSinceLastPurchase ?? "--"} jours, il représente {supplierShareLabel} de vos achats mensuels (
                {supplierMonthlySpend != null
                  ? euroFormatterNoDecimals.format(Math.round(supplierMonthlySpend))
                  : "--"}
                /mois).
              </AlertDescription>
            </Alert>

            <div className="rounded-md border">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Recettes impactées</TableHead>
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
                      const impactEuro = typeof row.impactEuro === "number" ? row.impactEuro : null
                      const costDelta =
                        typeof costStart === "number" && typeof costEnd === "number" && costStart !== 0
                          ? ((costEnd - costStart) / costStart) * 100
                          : null
                      const hasCost = typeof costStart === "number" && typeof costEnd === "number"
                      const hasSignificantDelta = typeof costDelta === "number" && Math.abs(costDelta) >= 0.001
                      const hasSignificantImpact =
                        typeof impactEuro === "number" && Math.abs(impactEuro) >= 0.001
                      const impactClass = hasSignificantImpact
                        ? impactEuro >= 0
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
                            {hasCost && hasSignificantImpact ? (
                              <span className="inline-flex items-baseline gap-1">
                                <span>
                                  {impactEuro >= 0 ? "-" : "+"}
                                  {euroFormatter.format(Math.abs(impactEuro))}
                                </span>
                                <span className="text-muted-foreground font-normal">
                                  / {row.isSold ? "vente" : "portion"}
                                </span>
                              </span>
                            ) : (
                              "--"
                            )}
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
  )
}
