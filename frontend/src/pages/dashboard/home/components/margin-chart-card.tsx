import { useMemo } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AreaChart as AreaChartBlock } from "@/components/blocks/area-chart"
import type { MarginSeriesPoint } from "../types"
import { EmptyState } from "./empty-state"

type MarginChartCardProps = {
  series: MarginSeriesPoint[]
}

export function MarginChartCard({ series }: MarginChartCardProps) {
  const diffNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  )

  const data = useMemo(() => series.slice(-5), [series])
  const latestValue = data.length ? data[data.length - 1].value : null
  const firstValue = data.length ? data[0].value : null
  const deltaValue =
    latestValue !== null && latestValue !== undefined && firstValue !== null && firstValue !== undefined
      ? latestValue - firstValue
      : null
  const currentLabel = latestValue !== null ? `${diffNumberFormatter.format(latestValue)}%` : "--"
  const deltaLabel =
    deltaValue === null
      ? "--"
      : `${deltaValue > 0 ? "+" : deltaValue < 0 ? "-" : ""}${diffNumberFormatter.format(
          Math.abs(deltaValue)
        )}%`
  const deltaClass =
    deltaValue === null
      ? "text-muted-foreground"
      : deltaValue > 0
        ? "text-green-500"
        : deltaValue < 0
          ? "text-red-500"
          : "text-muted-foreground"

  const formatShortDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }

  return (
    <Card className="md:col-span-6 h-full">
      <CardContent className="p-6 gap-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Marge moyenne de vos recettes</CardTitle>
            <p className="text-xs text-muted-foreground">5 dernières dates</p>
          </div>
          <div className="flex items-baseline justify-end gap-2 text-right">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{currentLabel}</p>
            <span className={`inline-flex items-center gap-1 text-sm font-medium ${deltaClass}`}>
              {deltaValue !== null && deltaValue !== 0 ? (
                deltaValue > 0 ? (
                  <ArrowUp className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDown className="h-3.5 w-3.5" />
                )
              ) : null}
              {deltaLabel}
            </span>
          </div>
        </div>
        <div className="mt-6 w-full">
          {data.length === 0 ? (
            <EmptyState message="Aucune marge a afficher pour le moment." className="min-h-[280px]" />
          ) : (
            <AreaChartBlock
              data={data}
              variant="bare"
              showHeader={false}
              defaultInterval="day"
              showDatePicker={false}
              showIntervalTabs={false}
              enableZoom={false}
              enableWheelZoom={false}
              minYPadding={2}
              height={280}
              areaColor="var(--chart-1)"
              tooltipLabel="Marge"
              tooltipValueFormatter={(value) => `${diffNumberFormatter.format(value)}%`}
              xTickFormatter={(date) =>
                formatShortDate(date instanceof Date ? date.toISOString().slice(0, 10) : `${date}`)
              }
              yTickFormatter={(value) => `${Math.round(value)}%`}
              xAxisProps={{
                interval: 0,
              }}
              chartClassName="h-[290px]"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}
