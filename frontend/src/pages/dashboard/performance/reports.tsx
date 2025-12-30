import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { type ChartConfig } from "@/components/ui/chart"
import ReportsHeader from "./components/ReportsHeader"
import ReportsTrendCard from "./components/ReportsTrendCard"
import ReportsHistoryCard from "./components/ReportsHistoryCard"
import ReportCreateDialog from "./components/ReportCreateDialog"

export default function PerformancesReportsPage() {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const startYear = 2023
  const yearOptions = Array.from(
    { length: currentYear - startYear + 1 },
    (_, index) => `${startYear + index}`
  )
  const [reportYear, setReportYear] = useState(`${currentYear}`)
  const monthNames = [
    "janvier",
    "fevrier",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "aout",
    "septembre",
    "octobre",
    "novembre",
    "decembre",
  ]
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string; monthIndex: number; year: number }[] = []
    const now = new Date()
    for (let offset = 1; offset <= 6; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
      const monthIndex = date.getMonth()
      const year = date.getFullYear()
      const label =
        `${monthNames[monthIndex].charAt(0).toUpperCase()}${monthNames[monthIndex].slice(1)}` +
        ` ${year}`
      options.push({
        value: `${year}-${monthIndex}`,
        label,
        monthIndex,
        year,
      })
    }
    return options
  }, [monthNames])
  const yearSuffix = reportYear.slice(-2)

  const baseSeries = useMemo(
    () => [
      { shortLabel: "Oct.", fullLabel: "Octobre", monthIndex: 9, revenue: 1025000, expenses: 612400, lastUpdated: "15 Janv. 25" },
      { shortLabel: "Nov.", fullLabel: "Novembre", monthIndex: 10, revenue: 1082000, expenses: 598300, lastUpdated: "15 Janv. 25" },
      { shortLabel: "Dec.", fullLabel: "Decembre", monthIndex: 11, revenue: 987500, expenses: 684200, lastUpdated: "20 Dec. 25" },
      { shortLabel: "Janv.", fullLabel: "Janvier", monthIndex: 0, revenue: 1018000, expenses: 623900, lastUpdated: "12 Fev. 25" },
      { shortLabel: "Fev.", fullLabel: "Fevrier", monthIndex: 1, revenue: 965400, expenses: 575600, lastUpdated: "18 Mars 25" },
      { shortLabel: "Mars", fullLabel: "Mars", monthIndex: 2, revenue: 1123000, expenses: 642800, lastUpdated: "08 Avr. 25" },
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
      monthKey: `${reportYear}-${item.monthIndex}`,
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
  const reportableRecipes = [
    { id: "aiguillettes", name: "Aiguillettes de poulet", price: 9.0, isActive: true, isSellable: true },
    { id: "andouillette", name: "Andouillette", price: 20.9, isActive: true, isSellable: true },
    { id: "bavette", name: "Bavette de boeuf, frites", price: 21.9, isActive: true, isSellable: true },
    { id: "camembert", name: "Camembert roti", price: 10.0, isActive: true, isSellable: true },
    { id: "bruschetta", name: "Bruschetta", price: 9.0, isActive: true, isSellable: true },
    { id: "burger", name: "Burger Tradition", price: 17.9, isActive: true, isSellable: true },
    { id: "creme", name: "Creme caramel", price: 8.0, isActive: true, isSellable: true },
    { id: "salade", name: "Salade Lyonnaise XL", price: 14.5, isActive: true, isSellable: true },
  ].filter((recipe) => recipe.isActive && recipe.isSellable)

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
        monthKey: item.monthKey,
      })),
    [reportSeries, reportYear]
  )

  const sortedReportRows = useMemo(
    () => [...reportRows].sort((a, b) => b.sortIndex - a.sortIndex),
    [reportRows]
  )
  const existingReportMonths = useMemo(
    () => new Set(reportRows.map((row) => row.monthKey)),
    [reportRows]
  )

  const handleReportNavigate = (reportId: string) => {
    navigate(`/dashboard/performance/reports/${reportId}`)
  }

  return (
    <div className="space-y-4">
      <ReportsHeader
        title="Rapports financiers"
        subtitle="Suivez la performance financiere de votre etablissement."
        ctaLabel="Comprendre mes rapports"
      />

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

      <ReportsHistoryCard
        rows={sortedReportRows}
        onNavigate={handleReportNavigate}
        formatEuro={formatEuro}
        formatPercent={formatPercent}
        headerAction={
          <ReportCreateDialog
            monthOptions={monthOptions}
            existingReportMonths={existingReportMonths}
            reportableRecipes={reportableRecipes}
            formatEuro={formatEuro}
          />
        }
      />
    </div>
  )
}
