import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type PerformanceMetric = {
  id: string
  label: string
  value: number
  delta: number | null
}

type ReportPerformanceMetricsProps = {
  title: string
  subtitle: string
  metrics: PerformanceMetric[]
  formatEuro: (value: number) => string
  formatPercent: (value: number) => string
}

export default function ReportPerformanceMetrics({
  title,
  subtitle,
  metrics,
  formatEuro,
  formatPercent,
}: ReportPerformanceMetricsProps) {
  return (
    <Card className="bg-transparent p-4">
      <CardHeader className="flex flex-col gap-4 p-0 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="flex w-full flex-wrap items-stretch justify-start gap-3 lg:w-auto lg:justify-end">
          {metrics.map((metric) => {
            const delta = metric.delta
            const hasDelta = typeof delta === "number" && Number.isFinite(delta)
            const isPositive = hasDelta ? delta >= 0 : null
            const deltaLabel = hasDelta
              ? `${isPositive ? "+" : "-"}${formatPercent(Math.abs(delta))}`
              : "-"

            return (
              <Card key={metric.id} className="w-full rounded-md border border-border/60 sm:w-[200px]">
                <CardContent className="space-y-3 p-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <div className="flex items-center justify-start gap-3">
                    {metric.id === "purchases" ? (
                      <span className="inline-flex items-center rounded-md border border-transparent px-2.5 py-0.5 text-base font-semibold">
                        {formatEuro(metric.value)}
                      </span>
                    ) : metric.id === "labor" ? (
                      <Badge variant="outline" className="text-base font-semibold hover:bg-transparent">
                        {formatEuro(metric.value)}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-base font-semibold hover:bg-secondary">
                        {formatEuro(metric.value)}
                      </Badge>
                    )}
                    {hasDelta ? (
                      <span
                        className={`text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
                      >
                        {deltaLabel}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">{deltaLabel}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardHeader>
    </Card>
  )
}
