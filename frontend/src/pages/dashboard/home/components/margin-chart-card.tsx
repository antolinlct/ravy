import { useMemo } from "react"
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

  const formatShortDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
  }

  return (
    <Card className="md:col-span-6 h-full">
      <CardContent className="p-6 gap-4 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <CardTitle>Marge moyenne de vos recettes</CardTitle>
          <p className="text-xs text-muted-foreground"> 5 dernières dates </p>
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
