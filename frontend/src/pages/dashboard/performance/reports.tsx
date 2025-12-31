import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { type ChartConfig } from "@/components/ui/chart"
import { useEstablishment } from "@/context/EstablishmentContext"
import ReportsHeader from "./components/ReportsHeader"
import ReportsTrendCard from "./components/ReportsTrendCard"
import ReportsHistoryCard from "./components/ReportsHistoryCard"
import ReportCreateDialog from "./components/ReportCreateDialog"
import {
  getReportMonthDate,
  getReportMonthKey,
  submitFinancialReport,
  usePerformanceReportsData,
} from "./api"

const formatMonthLabel = (date: Date) => {
  const formatted = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function PerformancesReportsPage() {
  const navigate = useNavigate()
  const { estId } = useEstablishment()
  const { reports, reportableRecipes, isLoading, error, reload } = usePerformanceReportsData()

  const currentYear = new Date().getFullYear()
  const reportYears = useMemo(() => {
    const years = new Set<number>()
    reports
      .map((report) => getReportMonthDate(report))
      .filter((date): date is Date => Boolean(date))
      .forEach((date) => years.add(date.getFullYear()))
    if (!years.size) {
      years.add(currentYear)
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [currentYear, reports])

  const yearOptions = reportYears.map((year) => `${year}`)
  const [reportYear, setReportYear] = useState(`${currentYear}`)

  useEffect(() => {
    if (!yearOptions.includes(reportYear)) {
      setReportYear(yearOptions[0] ?? `${currentYear}`)
    }
  }, [currentYear, reportYear, yearOptions])

  const shortMonthFormatter = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { month: "short" }),
    []
  )
  const longMonthFormatter = useMemo(
    () => new Intl.DateTimeFormat("fr-FR", { month: "long" }),
    []
  )
  const yearSuffix = reportYear.slice(-2)

  const reportSeries = useMemo(() => {
    const year = Number(reportYear)
    return reports
      .map((report) => ({
        report,
        monthDate: getReportMonthDate(report),
      }))
      .filter((item): item is { report: typeof reports[number]; monthDate: Date } => Boolean(item.monthDate))
      .filter((item) => item.monthDate.getFullYear() === year)
      .sort((a, b) => a.monthDate.getTime() - b.monthDate.getTime())
      .map((item) => {
        const revenue = typeof item.report.ca_total_ht === "number" ? item.report.ca_total_ht : 0
        const result = typeof item.report.ebitda === "number" ? item.report.ebitda : revenue
        const expenses =
          typeof item.report.variable_charges_total === "number"
            ? item.report.variable_charges_total
            : revenue - result
        const monthShort = shortMonthFormatter.format(item.monthDate)
        const monthLong = longMonthFormatter.format(item.monthDate)

        return {
          monthShort: `${monthShort.charAt(0).toUpperCase()}${monthShort.slice(1)} ${yearSuffix}`,
          monthFull: `${monthLong.charAt(0).toUpperCase()}${monthLong.slice(1)} ${reportYear}`,
          revenue,
          expenses,
          result: typeof item.report.ebitda === "number" ? item.report.ebitda : revenue - expenses,
        }
      })
  }, [longMonthFormatter, reportYear, reports, shortMonthFormatter, yearSuffix])

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
    if (reportSeries.length < 1) return null
    const first = reportSeries[0]
    const last = reportSeries[reportSeries.length - 1]

    const buildDelta = (start: number, end: number) => (start === 0 ? 0 : ((end - start) / start) * 100)

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

  const reportRows = useMemo(() => {
    const rows = reports
      .map((report) => {
        const monthDate = getReportMonthDate(report)
        if (!monthDate) return null
        const revenue = typeof report.ca_total_ht === "number" ? report.ca_total_ht : 0
        const result = typeof report.ebitda === "number" ? report.ebitda : revenue
        const expenses =
          typeof report.variable_charges_total === "number"
            ? report.variable_charges_total
            : revenue - result
        const margin = revenue ? (result / revenue) * 100 : 0
        const updatedAt = report.updated_at ? new Date(report.updated_at) : monthDate
        const lastUpdated = new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        }).format(updatedAt)

        return {
          id: report.id,
          period: formatMonthLabel(monthDate),
          lastUpdated,
          revenue,
          expenses,
          result,
          margin,
          sortIndex: monthDate.getTime(),
        }
      })
      .filter((row): row is { id: string; period: string; lastUpdated: string; revenue: number; expenses: number; result: number; margin: number; sortIndex: number } =>
        Boolean(row)
      )

    return rows.sort((a, b) => b.sortIndex - a.sortIndex)
  }, [reports])

  const existingReportMonths = useMemo(() => {
    return new Set(reports.map((report) => getReportMonthKey(report)).filter(Boolean) as string[])
  }, [reports])

  const monthOptions = useMemo(() => {
    const options: { value: string; label: string; monthIndex: number; year: number }[] = []
    const now = new Date()
    for (let offset = 1; offset <= 6; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const monthIndex = date.getMonth()
      const year = date.getFullYear()
      const monthLabel = longMonthFormatter.format(date)
      options.push({
        value: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
        label: `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)} ${year}`,
        monthIndex,
        year,
      })
    }
    return options
  }, [longMonthFormatter])

  const handleReportNavigate = (reportId: string) => {
    navigate(`/dashboard/performance/reports/${reportId}`)
  }

  const handleCreateReport = useCallback(
    async ({
      targetMonth,
      financialInputs,
      salesByRecipe,
    }: {
      targetMonth: Date
      financialInputs: {
        laborCost: string
        headcount: string
        fixedCosts: string
        variableCosts: string
        otherCosts: string
        revenueFood: string
        revenueTotal: string
      }
      salesByRecipe: Record<string, string>
    }) => {
      if (!estId) {
        throw new Error("Aucun etablissement selectionne.")
      }
      await submitFinancialReport({
        establishmentId: estId,
        targetMonth,
        financialInputs,
        salesByRecipe,
      })
      await reload()
    },
    [estId, reload]
  )

  return (
    <div className="space-y-4">
      <ReportsHeader
        title="Rapports financiers"
        subtitle="Suivez la performance financiere de votre etablissement."
        ctaLabel="Comprendre mes rapports"
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ReportsTrendCard
        reportYear={reportYear}
        yearOptions={yearOptions}
        onYearChange={setReportYear}
        reportSeries={reportSeries}
        chartConfig={chartConfig}
        formatEuro={formatEuro}
        formatPercent={formatPercent}
        reportSummary={reportSummary}
      />

      {isLoading && !reportRows.length ? (
        <p className="text-sm text-muted-foreground">Chargement des rapports...</p>
      ) : null}

      <ReportsHistoryCard
        rows={reportRows}
        onNavigate={handleReportNavigate}
        formatEuro={formatEuro}
        formatPercent={formatPercent}
        headerAction={
          <ReportCreateDialog
            monthOptions={monthOptions}
            existingReportMonths={existingReportMonths}
            reportableRecipes={reportableRecipes}
            formatEuro={formatEuro}
            onSubmit={handleCreateReport}
          />
        }
      />
    </div>
  )
}
