import { ArrowRight } from "lucide-react"
import { Pie, PieChart } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"

type MarginsSectionProps = {
  marginsCopy: {
    commercialTitle: string
    commercialTooltip: string
    multiplierTitle: string
    multiplierTooltip: string
    multiplierSolidLabel: string
    multiplierLiquidLabel: string
    multiplierSummary: string
    multiplierSummarySuffix: string
    operatingTitle: string
    operatingTooltip: string
    operatingNotePrefix: string
    operatingNoteSuffix: string
    breakEvenTitle: string
    breakEvenTooltip: string
    breakEvenNote: string
    safetyTitle: string
    safetyTooltip: string
    safetyNotePrefix: string
    safetyNoteSuffix: string
  }
  marginChartData: { category: string; amount: number; ratioOfCa: number; fill: string }[]
  marginChartConfig: ChartConfig
  reportData: {
    commercial_margin_total: number
    commercial_margin_total_ratio: number
    commercial_margin_solid_ratio: number
    commercial_margin_liquid_ratio: number
    multiplier_solid: number
    multiplier_liquid: number
    multiplier_global: number
    ebitda: number
    ebitda_ratio: number
    break_even_point: number
    safety_margin: number
    safety_margin_ratio: number
  }
  reportDeltas: {
    commercial_margin_total: number | null
    multiplier_solid: number | null
    multiplier_liquid: number | null
    multiplier_global: number | null
    ebitda: number | null
    break_even_point: number | null
    safety_margin: number | null
  }
  formatEuro: (value: number) => string
  formatPercent: (value: number) => string
  formatDelta: (delta: number | null) => string
  ratioCopy: (ratio: number) => string
  renderInfoHeader: (title: string, tooltip: string) => React.ReactNode
  renderDelta: (delta: number | null) => React.ReactNode
  deltaClass: (delta: number | null) => string
  pieTooltip: React.ReactElement
}

export default function MarginsSection({
  marginsCopy,
  marginChartData,
  marginChartConfig,
  reportData,
  reportDeltas,
  formatEuro,
  formatPercent,
  formatDelta,
  ratioCopy,
  renderInfoHeader,
  renderDelta,
  deltaClass,
  pieTooltip,
}: MarginsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-lg border border-border/60 p-4 space-y-2">
          <CardHeader className="p-0">
            {renderInfoHeader(marginsCopy.commercialTitle, marginsCopy.commercialTooltip)}
          </CardHeader>
          <CardContent className="space-y-2 p-0 text-center">
            <ChartContainer config={marginChartConfig} className="mx-auto aspect-square h-[150px]">
              <PieChart>
                <ChartTooltip content={pieTooltip} cursor={false} />
                <Pie data={marginChartData} dataKey="amount" nameKey="category" />
              </PieChart>
            </ChartContainer>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {ratioCopy(reportData.commercial_margin_total_ratio)}
              </p>
              <div className="flex items-baseline justify-center gap-3">
                <span className="text-[18px] font-semibold text-green-500">
                  {formatEuro(reportData.commercial_margin_total)}
                </span>
                {renderDelta(reportDeltas.commercial_margin_total)}
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <Card className="rounded-lg border border-border/60 p-4 space-y-2">
            <CardHeader className="p-0">
              {renderInfoHeader(marginsCopy.multiplierTitle, marginsCopy.multiplierTooltip)}
            </CardHeader>
            <CardContent className="space-y-3 p-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{marginsCopy.multiplierSolidLabel}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[18px] font-semibold text-foreground">
                      x{reportData.multiplier_solid}
                    </span>
                    {renderDelta(reportDeltas.multiplier_solid)}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{marginsCopy.multiplierLiquidLabel}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[18px] font-semibold text-foreground">
                      x{reportData.multiplier_liquid}
                    </span>
                    {renderDelta(reportDeltas.multiplier_liquid)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {marginsCopy.multiplierSummary}{" "}
                <span className="font-medium text-foreground">x{reportData.multiplier_global}</span>{" "}
                <span className={deltaClass(reportDeltas.multiplier_global)}>
                  ({formatDelta(reportDeltas.multiplier_global)})
                </span>
                {marginsCopy.multiplierSummarySuffix}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-border/60 p-4 space-y-2">
            <CardHeader className="p-0">
              {renderInfoHeader(marginsCopy.operatingTitle, marginsCopy.operatingTooltip)}
            </CardHeader>
            <CardContent className="space-y-2 p-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-green-500">
                  {formatEuro(reportData.ebitda)}
                </span>
                {renderDelta(reportDeltas.ebitda)}
              </div>
              <p className="text-xs text-muted-foreground">
                {marginsCopy.operatingNotePrefix} {formatPercent(reportData.ebitda_ratio)}{" "}
                {marginsCopy.operatingNoteSuffix}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="grid overflow-hidden rounded-lg border border-border/60 md:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-none border-0 bg-white p-4 space-y-2 shadow-none dark:bg-black">
          <CardHeader className="p-0">
            {renderInfoHeader(marginsCopy.breakEvenTitle, marginsCopy.breakEvenTooltip)}
          </CardHeader>
          <CardContent className="space-y-2 p-0">
            <div className="flex items-baseline gap-3">
              <span className="text-[18px] font-semibold text-foreground">
                {formatEuro(reportData.break_even_point)}
              </span>
              {renderDelta(reportDeltas.break_even_point)}
            </div>
            <p className="text-xs text-muted-foreground">{marginsCopy.breakEvenNote}</p>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0 border-t border-border/60 bg-white p-4 space-y-2 shadow-none dark:bg-black md:border-l md:border-t-0">
          <CardHeader className="p-0">
            {renderInfoHeader(marginsCopy.safetyTitle, marginsCopy.safetyTooltip)}
          </CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-semibold">{formatEuro(reportData.safety_margin)}</span>
                {renderDelta(reportDeltas.safety_margin)}
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-[18px] font-semibold">
                {formatPercent(reportData.safety_margin_ratio)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {marginsCopy.safetyNotePrefix} {formatPercent(reportData.safety_margin_ratio)}{" "}
              {marginsCopy.safetyNoteSuffix}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
