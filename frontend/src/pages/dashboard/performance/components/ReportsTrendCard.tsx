import { ArrowDown, ArrowUp, Calendar } from "lucide-react"
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

type ReportSeriesPoint = {
  monthShort: string
  monthFull: string
  revenue: number
  expenses: number
  result: number
}

type ReportSummary = {
  revenue: { current: number; delta: number }
  expenses: { current: number; delta: number }
  result: { current: number; delta: number }
}

type ReportsTrendCardProps = {
  reportYear: string
  yearOptions: string[]
  onYearChange: (value: string) => void
  reportSeries: ReportSeriesPoint[]
  chartConfig: ChartConfig
  formatEuro: (value: number) => string
  formatPercent: (value: number) => string
  reportSummary: ReportSummary | null
}

export default function ReportsTrendCard({
  reportYear,
  yearOptions,
  onYearChange,
  reportSeries,
  chartConfig,
  formatEuro,
  formatPercent,
  reportSummary,
}: ReportsTrendCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Performances des derniers mois</CardTitle>
        <Select value={reportYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[120px] gap-2">
            <Calendar className="h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year} value={year}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {reportSeries.length ? (
          <>
            <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
              <ComposedChart data={reportSeries} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="monthShort" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={80}
                  tickFormatter={(value) => formatEuro(Number(value))}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const tooltipLabel = payload[0]?.payload?.monthFull

                    return (
                      <div className="grid min-w-[10rem] gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl">
                        <div className="text-sm text-muted-foreground">{tooltipLabel}</div>
                        <Separator />
                        <div className="grid gap-1.5 text-sm">
                          {payload.map((item) => {
                            const key = `${item.dataKey || item.name || "value"}`
                            const config = chartConfig[key as keyof typeof chartConfig]
                            const indicatorColor = item.color || item.payload?.fill || config?.color
                            const value = typeof item.value === "number" ? formatEuro(item.value) : item.value

                            return (
                              <div key={key} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-[2px]"
                                    style={{ backgroundColor: indicatorColor }}
                                  />
                                  <span className="text-muted-foreground">
                                    {config?.label || item.name}
                                  </span>
                                </div>
                                <span className="font-medium tabular-nums text-foreground">{value}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} barSize={36} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[6, 6, 0, 0]} barSize={36} />
                <Area
                  type="monotone"
                  dataKey="result"
                  stroke="var(--color-result)"
                  fill="var(--color-result)"
                  fillOpacity={0.2}
                  strokeWidth={3}
                />
              </ComposedChart>
            </ChartContainer>

            {reportSummary && (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {[
                  { label: "Chiffre d'affaires", key: "revenue" as const },
                  { label: "Coûts", key: "expenses" as const },
                  { label: "Résultat", key: "result" as const },
                ].map((item) => {
                  const entry = reportSummary[item.key]
                  const isPositive = entry.delta >= 0
                  const deltaLabel = `${isPositive ? "+" : "-"}${formatPercent(Math.abs(entry.delta))}`

                  return (
                    <Card key={item.key} className="h-full rounded-lg border border-border/60">
                      <CardContent className="flex h-full items-center justify-between gap-3 p-4">
                        <div className="flex flex-1 items-center justify-between gap-3">
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                          {item.key === "revenue" ? (
                            <Badge variant="secondary" className="text-base font-semibold hover:bg-secondary">
                              {formatEuro(entry.current)}
                            </Badge>
                          ) : item.key === "result" ? (
                            <Badge variant="outline" className="text-base font-semibold hover:bg-transparent">
                              {formatEuro(entry.current)}
                            </Badge>
                          ) : (
                            <p className="text-base font-semibold">{formatEuro(entry.current)}</p>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            isPositive ? "text-green-500" : "text-red-500"
                          }`}
                        >
                          {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                          {deltaLabel}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Aucune donnee disponible pour {reportYear}.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
