import { Card, CardContent, CardHeader } from "@/components/ui/card"

import { Pie, PieChart } from "recharts"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"

type MenuSectionProps = {
  menuCopy: {
    splitTitle: string
    splitTooltip: string
    splitVsLabel: string
    splitNote: string
    averagesTitle: string
    averagesTooltip: string
    averagesRevenueLabel: string
    averagesCostLabel: string
    averagesMarginLabel: string
    averagesNotePrefix: string
    averagesNoteSuffix: string
    theoreticalTitle: string
    theoreticalTooltip: string
    theoreticalSalesLabel: string
    theoreticalCostLabel: string
  }
  reportData: {
    ca_tracked_recipes_ratio: number
    ca_untracked_recipes_ratio: number
    avg_revenue_per_dish: number
    avg_cost_per_dish: number
    avg_margin_per_dish: number
    avg_margin_delta: number
    theoretical_sales_solid: number
    theoretical_material_cost_solid: number
  }
  reportDeltas: {
    avg_revenue_per_dish: number | null
    avg_cost_per_dish: number | null
    avg_margin_per_dish: number | null
    theoretical_sales_solid: number | null
    theoretical_material_cost_solid: number | null
  }
  menuChartData: { category: string; amount: number; ratioOfCa: number; fill: string }[]
  menuChartConfig: ChartConfig
  formatEuro: (value: number) => string
  formatPercent: (value: number) => string
  renderInfoHeader: (title: string, tooltip: string) => React.ReactNode
  renderDelta: (delta: number | null) => React.ReactNode
  pieTooltip: React.ReactElement
}

export default function MenuSection({
  menuCopy,
  reportData,
  reportDeltas,
  menuChartData,
  menuChartConfig,
  formatEuro,
  formatPercent,
  renderInfoHeader,
  renderDelta,
  pieTooltip,
}: MenuSectionProps) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)]">
      <Card className="rounded-lg border border-border/60 p-4 space-y-2 lg:row-span-2">
        <CardHeader className="p-0">{renderInfoHeader(menuCopy.splitTitle, menuCopy.splitTooltip)}</CardHeader>
        <CardContent className="space-y-2 p-0 text-center">
          <ChartContainer config={menuChartConfig} className="mx-auto aspect-square h-[150px]">
            <PieChart>
              <ChartTooltip content={pieTooltip} cursor={false} />
              <Pie data={menuChartData} dataKey="amount" nameKey="category" />
            </PieChart>
          </ChartContainer>
          <div className="space-y-0.5">
            <div className="flex items-center justify-center gap-2 text-[18px] font-semibold">
              <span className="text-[color:var(--chart-1)]">
                {formatPercent(reportData.ca_tracked_recipes_ratio)}
              </span>
              <Badge variant="secondary" className="text-xs font-semibold">
                {menuCopy.splitVsLabel}
              </Badge>
              <span className="text-[color:var(--chart-5)]">
                {formatPercent(reportData.ca_untracked_recipes_ratio)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{menuCopy.splitNote}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-lg border border-border/60 p-4 space-y-2 lg:col-span-2 lg:min-h-[180px]">
        <CardHeader className="p-0 pb-2">
          {renderInfoHeader(menuCopy.averagesTitle, menuCopy.averagesTooltip)}
        </CardHeader>
        <CardContent className="space-y-6 p-0">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{menuCopy.averagesRevenueLabel}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold text-blue-500">
                  {formatEuro(reportData.avg_revenue_per_dish)}
                </span>
                {renderDelta(reportDeltas.avg_revenue_per_dish)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{menuCopy.averagesCostLabel}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold text-red-500">
                  {formatEuro(reportData.avg_cost_per_dish)}
                </span>
                {renderDelta(reportDeltas.avg_cost_per_dish)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{menuCopy.averagesMarginLabel}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold text-green-500">
                  {formatEuro(reportData.avg_margin_per_dish)}
                </span>
                {renderDelta(reportDeltas.avg_margin_per_dish)}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {menuCopy.averagesNotePrefix} {formatEuro(Math.abs(reportData.avg_margin_delta))}{" "}
            {menuCopy.averagesNoteSuffix}
          </p>
        </CardContent>
      </Card>
      <Card className="rounded-lg border border-dashed border-border/60 p-4 space-y-2 lg:col-span-2">
        <CardHeader className="p-0">
          {renderInfoHeader(menuCopy.theoreticalTitle, menuCopy.theoreticalTooltip)}
        </CardHeader>
        <CardContent className="grid gap-4 p-0 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{menuCopy.theoreticalSalesLabel}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold">
                {formatEuro(reportData.theoretical_sales_solid)}
              </span>
              {renderDelta(reportDeltas.theoretical_sales_solid)}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{menuCopy.theoreticalCostLabel}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold">
                {formatEuro(reportData.theoretical_material_cost_solid)}
              </span>
              {renderDelta(reportDeltas.theoretical_material_cost_solid)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
