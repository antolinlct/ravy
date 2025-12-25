import { useMemo, useState } from "react"
import { ArrowDown, ArrowRight, ArrowUp, Calendar, FilePlus, Info } from "lucide-react"
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function PerformancesReportsPage() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const startYear = 2023
  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => `${startYear + index}`
  )
  const [reportYear, setReportYear] = useState(`${currentYear}`)
  const yearSuffix = reportYear.slice(-2)

  const baseSeries = useMemo(
    () => [
      { shortLabel: "Oct.", fullLabel: "Octobre", revenue: 1025000, expenses: 612400, lastUpdated: "15 Janv. 25" },
      { shortLabel: "Nov.", fullLabel: "Novembre", revenue: 1082000, expenses: 598300, lastUpdated: "15 Janv. 25" },
      { shortLabel: "Dec.", fullLabel: "Decembre", revenue: 987500, expenses: 684200, lastUpdated: "20 Dec. 25" },
      { shortLabel: "Janv.", fullLabel: "Janvier", revenue: 1018000, expenses: 623900, lastUpdated: "12 Fev. 25" },
      { shortLabel: "Fev.", fullLabel: "Fevrier", revenue: 965400, expenses: 575600, lastUpdated: "18 Mars 25" },
      { shortLabel: "Mars", fullLabel: "Mars", revenue: 1123000, expenses: 642800, lastUpdated: "08 Avr. 25" },
    ],
    []
  )

  const reportSeries = useMemo(() => {
    if (reportYear !== `${currentYear}`) {
      return []
    }
    return baseSeries.map((item, index) => ({
      ...item,
      monthShort: `${item.shortLabel} ${yearSuffix}`,
      monthFull: `${item.fullLabel} ${reportYear}`,
      result: item.revenue - item.expenses,
      sortIndex: index,
    }))
  }, [baseSeries, currentYear, reportYear, yearSuffix])

  const chartConfig: ChartConfig = {
    revenue: {
      label: "Chiffre d'affaires",
      color: "var(--chart-1)",
    },
    expenses: {
      label: "Coûts",
      color: "var(--chart-2)",
    },
    result: {
      label: "Résultat",
      color: "var(--chart-5)",
    },
  }
  const formatEuro = (value: number) =>
    `${new Intl.NumberFormat("fr-FR").format(value)}\u00a0\u20ac`
  const formatPercent = (value: number) =>
    `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value)}%`

  const reportSummary = useMemo(() => {
    if (!reportSeries.length) return null
    const first = reportSeries[0]
    const last = reportSeries[reportSeries.length - 1]
    if (!first || !last) return null

    const buildDelta = (start: number, end: number) =>
      start === 0 ? 0 : ((end - start) / start) * 100

    return {
      revenue: {
        current: last.revenue,
        delta: buildDelta(first.revenue, last.revenue),
      },
      expenses: {
        current: last.expenses,
        delta: buildDelta(first.expenses, last.expenses),
      },
      result: {
        current: last.result,
        delta: buildDelta(first.result, last.result),
      },
    }
  }, [reportSeries])

  const reportRows = useMemo(
    () =>
      reportSeries.map((item) => ({
        id: `${item.fullLabel.toLowerCase().replace(/\s+/g, "-")}-${reportYear}`,
        period: `${item.fullLabel} ${reportYear}`,
        lastUpdated: item.lastUpdated,
        revenue: item.revenue,
        expenses: item.expenses,
        result: item.result,
        margin: item.revenue ? (item.result / item.revenue) * 100 : 0,
        sortIndex: item.sortIndex,
      })),
    [reportSeries, reportYear]
  )

  const sortedReportRows = useMemo(
    () => [...reportRows].sort((a, b) => b.sortIndex - a.sortIndex),
    [reportRows]
  )

  const handleReportNavigate = (reportId: string) => {
    navigate(`/dashboard/performance/reports/${reportId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Rapports financiers</h1>
          <p className="text-sm text-muted-foreground">
            Suivez la performance financiere de votre etablissement.
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Info className="h-4 w-4" />
          Comprendre mes rapports
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Performances des derniers mois</CardTitle>
          <Select value={reportYear} onValueChange={setReportYear}>
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
                              const value =
                                typeof item.value === "number" ? formatEuro(item.value) : item.value

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
                                  <span className="font-medium tabular-nums text-foreground">
                                    {value}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="var(--color-revenue)"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="var(--color-expenses)"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
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

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Rapports financiers</CardTitle>
            <p className="text-sm text-muted-foreground">
              Historique des rapports generes pour votre etablissement.
            </p>
          </div>
          <Button className="gap-2">
            <FilePlus className="h-4 w-4" />
            Creer un rapport
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-3 w-[28%]">Periode</TableHead>
                  <TableHead className="w-32 text-left">Chiffre d&apos;affaires</TableHead>
                  <TableHead className="w-28 text-left">Coûts</TableHead>
                  <TableHead className="w-28 text-left">Résultat</TableHead>
                  <TableHead className="w-36 text-left">Marge operationnelle</TableHead>
                  <TableHead className="w-10 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReportRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => handleReportNavigate(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        handleReportNavigate(row.id)
                      }
                    }}
                  >
                    <TableCell className="pl-3 w-[28%]">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{row.period}</p>
                        <p className="text-xs text-muted-foreground">
                          Derniere modif. : {row.lastUpdated}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge
                        variant="secondary"
                        className="inline-flex min-w-[96px] justify-center text-sm font-semibold"
                      >
                        {formatEuro(row.revenue)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <span className="inline-flex min-w-[96px] justify-start text-sm font-semibold">
                        {formatEuro(row.expenses)}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge
                        variant="outline"
                        className="inline-flex min-w-[96px] justify-center text-sm font-semibold"
                      >
                        {formatEuro(row.result)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left text-sm font-semibold">
                      {formatPercent(row.margin)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
                {!sortedReportRows.length ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      Aucun rapport disponible.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
