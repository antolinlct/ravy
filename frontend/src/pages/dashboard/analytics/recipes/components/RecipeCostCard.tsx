import { ArrowRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"
import { cn } from "@/lib/utils"
import type { RecipeIngredientRow } from "../types"

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

export type RecipeCostCardProps = {
  hasSelection: boolean
  selectedRecipeName: string
  filteredCostPerPortionSeries: Array<{ date?: Date | string; value?: number }>
  costTitle: string
  costPerPortionLatest: number | null
  costPerPortionDelta: number | null
  costPerPortionDeltaLabel: string
  analysisStartLabel: string
  analysisEndLabel: string
  sortedIngredientRows: RecipeIngredientRow[]
  euroFormatter: Intl.NumberFormat
  percentFormatter: Intl.NumberFormat
}

export const RecipeCostCard = ({
  hasSelection,
  selectedRecipeName,
  filteredCostPerPortionSeries,
  costTitle,
  costPerPortionLatest,
  costPerPortionDelta,
  costPerPortionDeltaLabel,
  analysisStartLabel,
  analysisEndLabel,
  sortedIngredientRows,
  euroFormatter,
  percentFormatter,
}: RecipeCostCardProps) => {
  const deltaClass =
    costPerPortionDelta !== null && costPerPortionDelta >= 0 ? "text-red-500" : "text-green-500"

  if (!hasSelection) return null

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <CardTitle>Coût d&apos;achat de la recette {selectedRecipeName}</CardTitle>
        {filteredCostPerPortionSeries.length ? (
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
                    <span className={cn("text-sm font-semibold", deltaClass)}>{costPerPortionDeltaLabel}</span>
                  </div>
                </div>
              </div>
            }
          />
        ) : (
          <div className="flex h-[240px] items-center justify-center rounded-md border bg-muted/20 text-sm text-muted-foreground">
            Aucun historique de coût disponible.
          </div>
        )}
        <div className="rounded-md border">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Ingrédients</TableHead>
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
                  const costStart = typeof row.costStart === "number" ? row.costStart : null
                  const costEnd = typeof row.costEnd === "number" ? row.costEnd : null
                  const impactEuro = typeof row.impactEuro === "number" ? row.impactEuro : null
                  const costDelta =
                    costStart !== null && costEnd !== null && costStart !== 0
                      ? ((costEnd - costStart) / costStart) * 100
                      : null
                  const hasCost = costStart !== null && costEnd !== null
                  const hasSignificantDelta = typeof costDelta === "number" && Math.abs(costDelta) >= 0.001
                  const hasSignificantImpact = typeof impactEuro === "number" && Math.abs(impactEuro) >= 0.001
                  const impactClass =
                    hasSignificantImpact && impactEuro !== null
                      ? impactEuro >= 0
                        ? "text-red-500"
                        : "text-green-500"
                      : "text-muted-foreground"
                  const quantityLabel =
                    typeof row.quantity === "number" ? row.quantity.toString().replace(".", ",") : "--"
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="w-[30%]">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{row.name}</p>
                          {row.type === "FIXED" ? (
                            <p className="text-xs text-muted-foreground">Ingrédient fixe</p>
                          ) : row.type === "SUBRECIPE" ? (
                            <p className="text-xs text-muted-foreground">
                              Sous recettes : {row.portions ?? "--"} portions
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {quantityLabel} {row.unit ?? ""}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="w-24 pr-6 text-sm font-semibold text-muted-foreground">
                        {hasCost && typeof row.weightShare === "number" ? percentFormatter.format(row.weightShare) : "--"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "w-28 pr-6 text-sm font-semibold",
                          hasCost ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {hasCost && costStart !== null ? euroFormatter.format(costStart) : "--"}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "w-28 pr-6 text-sm font-semibold",
                          hasCost ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {hasCost && costEnd !== null ? euroFormatter.format(costEnd) : "--"}
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
                        {hasCost && hasSignificantImpact && impactEuro !== null ? (
                          <span>
                            {impactEuro >= 0 ? "-" : "+"}
                            {euroFormatter.format(Math.abs(impactEuro))}
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
                  )}
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
