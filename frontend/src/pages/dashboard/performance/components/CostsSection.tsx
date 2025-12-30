import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"

type CostMetric = {
  title: string
  tooltip: string
  value: number
  delta: number | null
  helper: string
}

type CostMetrics = {
  materials: CostMetric
  labor: CostMetric
  production: CostMetric
  occupancy: CostMetric
  other: CostMetric
  overhead: CostMetric
  operating: CostMetric
}

type CostsSectionProps = {
  costMetrics: CostMetrics
  materialCostRatio: number
  materialsChartData: { category: string; amount: number; fill: string }[]
  materialsChartConfig: ChartConfig
  ratioCopy: (ratio: number) => string
  renderInfoHeader: (title: string, tooltip: string) => React.ReactNode
  renderDelta: (delta: number | null) => React.ReactNode
  formatEuro: (value: number) => string
  pieTooltip: React.ReactElement
}

export default function CostsSection({
  costMetrics,
  materialCostRatio,
  materialsChartData,
  materialsChartConfig,
  ratioCopy,
  renderInfoHeader,
  renderDelta,
  formatEuro,
  pieTooltip,
}: CostsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <Card className="rounded-lg border border-border/60 p-4 space-y-2 lg:row-span-2">
          <CardHeader className="p-0">
            {renderInfoHeader(costMetrics.materials.title, costMetrics.materials.tooltip)}
          </CardHeader>
          <CardContent className="space-y-2 p-0 text-center">
            <ChartContainer config={materialsChartConfig} className="mx-auto aspect-square h-[150px]">
              <PieChart>
                <ChartTooltip content={pieTooltip} cursor={false} />
                <Pie data={materialsChartData} dataKey="amount" nameKey="category" />
              </PieChart>
            </ChartContainer>
            <div className="space-y-0.5">
              <p className="text-sm text-muted-foreground">
                {ratioCopy(materialCostRatio)}
              </p>
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-[18px] font-semibold text-red-500">
                  {formatEuro(costMetrics.materials.value)}
                </span>
                {renderDelta(costMetrics.materials.delta)}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:col-span-2 lg:grid-cols-2">
          <Card className="rounded-lg border border-border/60 p-4 space-y-2">
            <CardHeader className="p-0">{renderInfoHeader(costMetrics.labor.title, costMetrics.labor.tooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-foreground">
                  {formatEuro(costMetrics.labor.value)}
                </span>
                {renderDelta(costMetrics.labor.delta)}
              </div>
              <p className="text-xs text-muted-foreground">{costMetrics.labor.helper}</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-border/60 p-4 space-y-2">
            <CardHeader className="p-0">{renderInfoHeader(costMetrics.other.title, costMetrics.other.tooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold">{formatEuro(costMetrics.other.value)}</span>
                {renderDelta(costMetrics.other.delta)}
              </div>
              <p className="text-xs text-muted-foreground">{costMetrics.other.helper}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-lg border border-border/60 p-4 space-y-2 lg:col-span-2">
          <CardHeader className="p-0">
            {renderInfoHeader(costMetrics.production.title, costMetrics.production.tooltip)}
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold text-red-500">
                {formatEuro(costMetrics.production.value)}
              </span>
              {renderDelta(costMetrics.production.delta)}
            </div>
            <p className="text-xs text-muted-foreground">{costMetrics.production.helper}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid overflow-hidden rounded-lg border border-border/60 md:grid-cols-3">
        <Card className="rounded-none border-0 bg-white p-4 space-y-2 shadow-none dark:bg-black">
          <CardHeader className="p-0">
            {renderInfoHeader(costMetrics.occupancy.title, costMetrics.occupancy.tooltip)}
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold">{formatEuro(costMetrics.occupancy.value)}</span>
              {renderDelta(costMetrics.occupancy.delta)}
            </div>
            <p className="text-xs text-muted-foreground">{costMetrics.occupancy.helper}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0 border-t border-border/60 bg-white p-4 space-y-2 shadow-none dark:bg-black md:border-l md:border-t-0">
          <CardHeader className="p-0">
            {renderInfoHeader(costMetrics.overhead.title, costMetrics.overhead.tooltip)}
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold">{formatEuro(costMetrics.overhead.value)}</span>
              {renderDelta(costMetrics.overhead.delta)}
            </div>
            <p className="text-xs text-muted-foreground">{costMetrics.overhead.helper}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0 border-t border-border/60 bg-white p-4 space-y-2 shadow-none dark:bg-black md:border-l md:border-t-0">
          <CardHeader className="p-0">
            {renderInfoHeader(costMetrics.operating.title, costMetrics.operating.tooltip)}
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold text-red-500">
                {formatEuro(costMetrics.operating.value)}
              </span>
              {renderDelta(costMetrics.operating.delta)}
            </div>
            <p className="text-xs text-muted-foreground">{costMetrics.operating.helper}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
