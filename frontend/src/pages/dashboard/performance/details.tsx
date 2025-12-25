import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FilePenLine,
  BookMarked,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Info,
  Trash2,
  Users,
} from "lucide-react"

import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Pie, PieChart, type TooltipProps } from "recharts"
import ConsultantAvatar from "@/assets/avatar.png"

export default function PerformancesReportsDetailsPage() {
  const reportData = {
    monthLabel: "Mars 2025",
    ca_total_ht: 79381,
    ca_tracked_recipes_ratio: 18,
    ca_untracked_recipes_ratio: 82,
    material_cost_total: 28095.11,
    material_cost_ratio_solid: 68,
    material_cost_ratio_liquid: 32,
    material_cost_ratio: 63.7,
    labor_cost_total: 22500,
    labor_cost_ratio: 28.3,
    production_cost_total: 50595.11,
    production_cost_ratio: 63.7,
    fixed_charges_total: 8168.57,
    fixed_charges_ratio: 10.3,
    other_charges_total: 5981.34,
    other_charges_ratio: 7.5,
    variable_charges_total: 64745.02,
    variable_charges_ratio: 81.6,
    revenue_per_employee: 9922.58,
    result_per_employee: 1829.45,
    salary_per_employee: 2812.5,
    avg_revenue_per_dish: 10.42,
    avg_cost_per_dish: 2.18,
    avg_margin_per_dish: 8.24,
    avg_margin_delta: -0.9,
    theoretical_sales_solid: 7577.91,
    theoretical_material_cost_solid: 1585.31,
    commercial_margin_total: 51285.54,
    commercial_margin_total_ratio: 18.4,
    commercial_margin_solid_ratio: 62,
    commercial_margin_liquid_ratio: 38,
    multiplier_solid: 4.3,
    multiplier_liquid: 2.0,
    multiplier_global: 2.8,
    ebitda: 14635.63,
    ebitda_ratio: 18.4,
    break_even_point: 33167.76,
    safety_margin: 46212.89,
    safety_margin_ratio: 58.2,
  }

  const reportDeltas = {
    revenue: -6.6,
    labor: null,
    purchases: 67.9,
    result: -68.5,
    material_cost_total: 98.1,
    labor_cost_total: null,
    production_cost_total: 37.9,
    fixed_charges_total: 399.9,
    other_charges_total: 2292.5,
    variable_charges_total: 67.9,
    revenue_per_employee: -6.6,
    result_per_employee: -68.5,
    avg_revenue_per_dish: -9.5,
    avg_cost_per_dish: -9.5,
    avg_margin_per_dish: -9.5,
    theoretical_sales_solid: -82.0,
    theoretical_material_cost_solid: -83.6,
    commercial_margin_total: -27.6,
    multiplier_solid: 25.6,
    multiplier_liquid: -91.2,
    multiplier_global: -52.9,
    ebitda: -68.5,
    break_even_point: 37.0,
    safety_margin: -24.0,
    safety_margin_ratio: -18.6,
  }

  const reportMonth = reportData.monthLabel
  const otherChargesTotal = Math.max(
    reportData.production_cost_total - reportData.material_cost_total - reportData.labor_cost_total,
    0
  )
  const otherChargesRatio = reportData.ca_total_ht
    ? (otherChargesTotal / reportData.ca_total_ht) * 100
    : 0
  const [activeSection, setActiveSection] = useState<"costs" | "margins" | "labor" | "menu">(
    "costs"
  )
  const performanceMetrics = [
    {
      id: "revenue",
      label: "Chiffre d'affaires",
      value: reportData.ca_total_ht,
      delta: reportDeltas.revenue,
    },
    {
      id: "labor",
      label: "Main d'œuvre",
      value: reportData.labor_cost_total,
      delta: reportDeltas.labor,
    },
    {
      id: "purchases",
      label: "Achats & charges",
      value: reportData.variable_charges_total,
      delta: reportDeltas.purchases,
    },
    {
      id: "result",
      label: "Résultat opérationnel",
      value: reportData.ebitda,
      delta: reportDeltas.result,
    },
  ]

  const formatEuro = (value: number) =>
    `${new Intl.NumberFormat("fr-FR").format(value)}\u00a0\u20ac`
  const formatPercent = (value: number) =>
    `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value)}%`
  const formatDelta = (delta: number | null) =>
    delta === null || !Number.isFinite(delta)
      ? "- %"
      : `${delta >= 0 ? "+" : "-"}${formatPercent(Math.abs(delta))}`
  const deltaClass = (delta: number | null) =>
    delta === null || !Number.isFinite(delta)
      ? "text-muted-foreground"
      : delta >= 0
        ? "text-green-500"
        : "text-red-500"
  const renderDelta = (delta: number | null) => {
    if (delta === null || !Number.isFinite(delta)) {
      return <span className="text-sm font-medium text-muted-foreground">- %</span>
    }
    return (
      <span className={`inline-flex items-center gap-1 text-sm font-medium ${deltaClass(delta)}`}>
        {formatDelta(delta)}
      </span>
    )
  }
  const ratioCopy = (ratio: number) => `${formatPercent(ratio)} de votre chiffre d'affaires`
  const renderInfoHeader = (title: string, tooltip: string) => (
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm text-muted-foreground">{title}</p>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex text-muted-foreground transition-colors hover:text-foreground">
            <Info className="h-4 w-4" />
            <span className="sr-only">Information</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  )

  const normalizeRatio = (ratio: number) => (ratio > 1 ? ratio / 100 : ratio)
  const materialSolidAmount =
    reportData.material_cost_total * normalizeRatio(reportData.material_cost_ratio_solid)
  const materialLiquidAmount =
    reportData.material_cost_total * normalizeRatio(reportData.material_cost_ratio_liquid)

  const marginSolidAmount =
    reportData.commercial_margin_total *
    normalizeRatio(reportData.commercial_margin_solid_ratio)
  const marginLiquidAmount =
    reportData.commercial_margin_total *
    normalizeRatio(reportData.commercial_margin_liquid_ratio)
  const menuFixedAmount =
    reportData.ca_total_ht * normalizeRatio(reportData.ca_tracked_recipes_ratio)
  const menuVariableAmount =
    reportData.ca_total_ht * normalizeRatio(reportData.ca_untracked_recipes_ratio)

  const PieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload?.length) return null

    return (
      <div className="grid min-w-[11rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        {payload.map((entry) => {
          const label = entry.name ?? entry.payload?.category
          const amount =
            typeof entry.payload?.amount === "number"
              ? entry.payload.amount
              : typeof entry.value === "number"
                ? entry.value
                : 0
          const indicatorColor = entry.payload?.fill || entry.color

          const ratioOfCa = entry.payload?.ratioOfCa
          const ratioText =
            typeof ratioOfCa === "number" ? `${formatPercent(ratioOfCa)} du CA` : null

          return (
            <div key={`${label}-${amount}`} className="flex items-start gap-2">
              <span
                className="mt-1 h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: indicatorColor }}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground whitespace-nowrap">{label}</span>
                  <span className="font-medium text-foreground">{formatEuro(amount)}</span>
                </div>
                {ratioText ? (
                  <span className="text-xs text-muted-foreground">{ratioText}</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const materialsChartData = [
    {
      category: "Matières solides",
      amount: materialSolidAmount,
      fill: "var(--color-solid)",
    },
    {
      category: "Matières liquides",
      amount: materialLiquidAmount,
      fill: "var(--color-liquid)",
    },
  ]

  const materialsChartConfig = {
    amount: {
      label: "Montant",
    },
    solid: {
      label: "Matières solides",
      color: "var(--chart-3)",
    },
    liquid: {
      label: "Matières liquides",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  const marginChartData = [
    {
      category: "Sur solide",
      amount: marginSolidAmount,
      ratioOfCa: reportData.commercial_margin_solid_ratio,
      fill: "var(--color-solid)",
    },
    {
      category: "Sur liquide",
      amount: marginLiquidAmount,
      ratioOfCa: reportData.commercial_margin_liquid_ratio,
      fill: "var(--color-liquid)",
    },
  ]

  const marginChartConfig = {
    amount: {
      label: "Montant",
    },
    solid: {
      label: "Sur solide",
      color: "var(--chart-1)",
    },
    liquid: {
      label: "Sur liquide",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig

  const menuChartData = [
    {
      category: "Carte fixe",
      amount: menuFixedAmount,
      ratioOfCa: reportData.ca_tracked_recipes_ratio,
      fill: "var(--color-fixed)",
    },
    {
      category: "Carte variable",
      amount: menuVariableAmount,
      ratioOfCa: reportData.ca_untracked_recipes_ratio,
      fill: "var(--color-variable)",
    },
  ]

  const menuChartConfig = {
    amount: {
      label: "Montant",
    },
    fixed: {
      label: "Carte fixe",
      color: "var(--chart-1)",
    },
    variable: {
      label: "Carte variable",
      color: "var(--chart-5)",
    },
  } satisfies ChartConfig

  const costMetrics = {
    materials: {
      title: "Matières premières",
      tooltip: "Part des dépenses liées aux achats de matières premières.",
      value: reportData.material_cost_total,
      delta: reportDeltas.material_cost_total,
      helper: "Coût matière total sur la période.",
    },
    labor: {
      title: "Salaires & charges",
      tooltip: "Total des salaires et charges sociales sur la période.",
      value: reportData.labor_cost_total,
      delta: reportDeltas.labor_cost_total,
      helper: ratioCopy(reportData.labor_cost_ratio),
    },
    production: {
      title: "Coût de revient",
      tooltip: "Coût global pour produire vos ventes sur la période.",
      value: reportData.production_cost_total,
      delta: reportDeltas.production_cost_total,
      helper: ratioCopy(reportData.production_cost_ratio),
    },
    occupancy: {
      title: "Coût d'occupation",
      tooltip: "Poids des loyers et charges liées aux locaux.",
      value: reportData.fixed_charges_total,
      delta: reportDeltas.fixed_charges_total,
      helper: ratioCopy(reportData.fixed_charges_ratio),
    },
    other: {
      title: "Autres charge directes",
      tooltip: "Charges complémentaires qui impactent vos coûts.",
      value: otherChargesTotal,
      delta: reportDeltas.other_charges_total,
      helper: ratioCopy(otherChargesRatio),
    },
    overhead: {
      title: "Frais généraux",
      tooltip: "Dépenses fixes hors achats et salaires.",
      value: reportData.other_charges_total,
      delta: reportDeltas.other_charges_total,
      helper: ratioCopy(reportData.other_charges_ratio),
    },
    operating: {
      title: "Coûts d'exploitation",
      tooltip: "Synthèse des coûts opérationnels récurrents.",
      value: reportData.variable_charges_total,
      delta: reportDeltas.variable_charges_total,
      helper: ratioCopy(reportData.variable_charges_ratio),
    },
  }

  const marginsCopy = {
    commercialTitle: "Marge commerciale",
    commercialTooltip: "Répartition de la marge commerciale sur la période.",
    multiplierTitle: "Coefficient multiplicateur",
    multiplierTooltip: "Mesure la capacité de marge par type de ventes.",
    multiplierSolidLabel: "Sur solide",
    multiplierLiquidLabel: "Sur liquide",
    multiplierSummary: "Votre coefficient multiplicateur global est de",
    multiplierSummarySuffix: ".",
    operatingTitle: "Marge opérationnelle",
    operatingTooltip: "Résultat opérationnel sur la période.",
    operatingNotePrefix: "Votre marge bénéficiaire représente",
    operatingNoteSuffix: "de votre chiffre d'affaires.",
    breakEvenTitle: "Seuil de rentabilité",
    breakEvenTooltip: "Niveau de chiffre d'affaires minimum pour atteindre l'équilibre.",
    breakEvenNote: "En dessous de ce montant de CA, votre établissement subira des pertes.",
    safetyTitle: "Marge de sécurité",
    safetyTooltip: "Capacité à absorber une baisse d'activité.",
    safetyAmountLabel: "Montant",
    safetyPercentLabel: "Pourcentage",
    safetyNotePrefix: "Une diminution de",
    safetyNoteSuffix: "de votre activité n'entraînera pas de conséquences financières graves.",
  }

  const laborCopy = {
    efficiencyTitle: "Efficacité des employés",
    efficiencyTooltip: "Performance moyenne par employé.",
    efficiencyRevenueLabel: "Revenus par employé",
    efficiencyResultLabel: "Résultat par employé",
    efficiencyNote: "Vos employés ont diminué leur productivité de -705,2 € ce mois-ci.",
    payrollTitle: "Salaires & charges",
    payrollTooltip: "Synthèse de la masse salariale.",
    payrollTotalLabel: "Masse salariale totale",
    payrollPerEmployeeLabel: "Masse salariale par employé",
    payrollNotePrefix: "Cette dépense représente",
    payrollNoteSuffix: "de votre chiffre d'affaires.",
  }

  const menuCopy = {
    splitTitle: "Carte fixe vs. variable",
    splitTooltip: "Répartition de la carte selon la présence sur RAVY.",
    splitVsLabel: "vs.",
    splitNote:
      "Répartition entre vos plats présents sur RAVY (carte fixe) et les autres (carte variable).",
    averagesTitle: "Moyenne par plat sur RAVY",
    averagesTooltip: "Comparatif des moyennes par plat sur la période.",
    averagesRevenueLabel: "Revenu moyen",
    averagesCostLabel: "Coût moyen",
    averagesMarginLabel: "Marge moyenne",
    averagesNotePrefix: "Vous avez diminué votre marge par recette de",
    averagesNoteSuffix: "ce mois-ci.",
    theoreticalTitle: "Données théoriques",
    theoreticalTooltip: "Valeurs théoriques calculées sur la base des fiches recettes.",
    theoreticalSalesLabel: "Chiffre d'affaires alimentaire théorique",
    theoreticalCostLabel: "Coût matière solide théorique",
  }
  const consultantCopy = {
    lead:
      "Vos données financières montrent encore des leviers rapides d’optimisation. Concentrez-vous sur les postes les plus lourds pour améliorer vos marges dès les prochains mois.",
    tail:
      "Un suivi régulier de ces indicateurs aide à stabiliser votre trésorerie et à mieux anticiper les écarts.",
  }

  const sidebarItems = [
    { id: "costs" as const, label: "Analyse des coûts", icon: BanknoteArrowDown },
    { id: "margins" as const, label: "Marges et rentabilité", icon: BanknoteArrowUp },
    { id: "labor" as const, label: "Main d'œuvre", icon: Users },
    { id: "menu" as const, label: "Efficacité du menu", icon: BookMarked },
  ]

  const sectionContent = {
    costs: (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
          <Card className="rounded-lg border border-border/60 p-4 space-y-2 lg:row-span-2">
            <CardHeader className="p-0">{renderInfoHeader(costMetrics.materials.title, costMetrics.materials.tooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0 text-center">
              <ChartContainer config={materialsChartConfig} className="mx-auto aspect-square h-[150px]">
                <PieChart>
                  <ChartTooltip content={<PieTooltip />} cursor={false} />
                  <Pie data={materialsChartData} dataKey="amount" nameKey="category" />
                </PieChart>
              </ChartContainer>
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">
                  {ratioCopy(reportData.material_cost_ratio)}
                </p>
                <div className="flex items-baseline justify-center gap-3">
                  <span className="text-[18px] font-semibold text-red-500">
                    {formatEuro(costMetrics.materials.value)}
                  </span>
                  <span className={`text-sm font-medium ${deltaClass(costMetrics.materials.delta)}`}>
                    {formatDelta(costMetrics.materials.delta)}
                  </span>
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
            <CardHeader className="p-0">{renderInfoHeader(costMetrics.production.title, costMetrics.production.tooltip)}</CardHeader>
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
            <CardHeader className="p-0">{renderInfoHeader(costMetrics.occupancy.title, costMetrics.occupancy.tooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold">{formatEuro(costMetrics.occupancy.value)}</span>
                {renderDelta(costMetrics.occupancy.delta)}
              </div>
              <p className="text-xs text-muted-foreground">{costMetrics.occupancy.helper}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-0 border-t border-border/60 bg-white p-4 space-y-2 shadow-none dark:bg-black md:border-l md:border-t-0">
            <CardHeader className="p-0">{renderInfoHeader(costMetrics.overhead.title, costMetrics.overhead.tooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold">{formatEuro(costMetrics.overhead.value)}</span>
                {renderDelta(costMetrics.overhead.delta)}
              </div>
              <p className="text-xs text-muted-foreground">{costMetrics.overhead.helper}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-0 border-t border-border/60 bg-white p-4 space-y-2 shadow-none dark:bg-black md:border-l md:border-t-0">
            <CardHeader className="p-0">{renderInfoHeader(costMetrics.operating.title, costMetrics.operating.tooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-red-500">{formatEuro(costMetrics.operating.value)}</span>
                {renderDelta(costMetrics.operating.delta)}
              </div>
              <p className="text-xs text-muted-foreground">{costMetrics.operating.helper}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    margins: (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-lg border border-border/60 p-4 space-y-2">
            <CardHeader className="p-0">{renderInfoHeader(marginsCopy.commercialTitle, marginsCopy.commercialTooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0 text-center">
              <ChartContainer config={marginChartConfig} className="mx-auto aspect-square h-[150px]">
                <PieChart>
                  <ChartTooltip content={<PieTooltip />} cursor={false} />
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
              <CardHeader className="p-0">{renderInfoHeader(marginsCopy.multiplierTitle, marginsCopy.multiplierTooltip)}</CardHeader>
              <CardContent className="space-y-3 p-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{marginsCopy.multiplierSolidLabel}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[18px] font-semibold text-foreground">x{reportData.multiplier_solid}</span>
                      {renderDelta(reportDeltas.multiplier_solid)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{marginsCopy.multiplierLiquidLabel}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[18px] font-semibold text-foreground">x{reportData.multiplier_liquid}</span>
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
              <CardHeader className="p-0">{renderInfoHeader(marginsCopy.operatingTitle, marginsCopy.operatingTooltip)}</CardHeader>
              <CardContent className="space-y-2 p-0">
                <div className="flex items-baseline gap-3">
                  <span className="text-[18px] font-semibold text-green-500">{formatEuro(reportData.ebitda)}</span>
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
            <CardHeader className="p-0">{renderInfoHeader(marginsCopy.breakEvenTitle, marginsCopy.breakEvenTooltip)}</CardHeader>
            <CardContent className="space-y-2 p-0">
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-foreground">{formatEuro(reportData.break_even_point)}</span>
                {renderDelta(reportDeltas.break_even_point)}
              </div>
              <p className="text-xs text-muted-foreground">{marginsCopy.breakEvenNote}</p>
            </CardContent>
          </Card>
          <Card className="rounded-none border-0 border-t border-border/60 bg-white p-4 space-y-2 shadow-none dark:bg-black md:border-l md:border-t-0">
            <CardHeader className="p-0">{renderInfoHeader(marginsCopy.safetyTitle, marginsCopy.safetyTooltip)}</CardHeader>
            <CardContent className="space-y-3 p-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold">{formatEuro(reportData.safety_margin)}</span>
                  {renderDelta(reportDeltas.safety_margin)}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-[18px] font-semibold">{formatPercent(reportData.safety_margin_ratio)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {marginsCopy.safetyNotePrefix} {formatPercent(reportData.safety_margin_ratio)}{" "}
                {marginsCopy.safetyNoteSuffix}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    ),
    labor: (
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border border-border/60 p-4 space-y-2">
          <CardHeader className="p-0">{renderInfoHeader(laborCopy.efficiencyTitle, laborCopy.efficiencyTooltip)}</CardHeader>
          <CardContent className="space-y-4 p-0">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{laborCopy.efficiencyRevenueLabel}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-foreground">{formatEuro(reportData.revenue_per_employee)}</span>
                {renderDelta(reportDeltas.revenue_per_employee)}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{laborCopy.efficiencyResultLabel}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-green-500">{formatEuro(reportData.result_per_employee)}</span>
                {renderDelta(reportDeltas.result_per_employee)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{laborCopy.efficiencyNote}</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border/60 p-4 space-y-2">
          <CardHeader className="p-0">{renderInfoHeader(laborCopy.payrollTitle, laborCopy.payrollTooltip)}</CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{laborCopy.payrollTotalLabel}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-red-500">{formatEuro(reportData.labor_cost_total)}</span>
                {renderDelta(reportDeltas.labor_cost_total)}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{laborCopy.payrollPerEmployeeLabel}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold text-red-500">{formatEuro(reportData.salary_per_employee)}</span>
                {renderDelta(reportDeltas.labor_cost_total)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {laborCopy.payrollNotePrefix} {formatPercent(reportData.labor_cost_ratio)}{" "}
              {laborCopy.payrollNoteSuffix}
            </p>
          </CardContent>
        </Card>
      </div>
    ),
    menu: (
      <div className="grid items-stretch gap-4 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)]">
        <Card className="rounded-lg border border-border/60 p-4 space-y-2 lg:row-span-2">
          <CardHeader className="p-0">{renderInfoHeader(menuCopy.splitTitle, menuCopy.splitTooltip)}</CardHeader>
          <CardContent className="space-y-2 p-0 text-center">
            <ChartContainer config={menuChartConfig} className="mx-auto aspect-square h-[150px]">
              <PieChart>
                <ChartTooltip content={<PieTooltip />} cursor={false} />
                <Pie data={menuChartData} dataKey="amount" nameKey="category" />
              </PieChart>
            </ChartContainer>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center gap-2 text-[18px] font-semibold">
                <span className="text-[color:var(--chart-1)]">
                  {formatPercent(reportData.ca_tracked_recipes_ratio)}
                </span>
                <Badge variant="secondary" className="text-xs font-semibold">{menuCopy.splitVsLabel}</Badge>
                <span className="text-[color:var(--chart-5)]">
                  {formatPercent(reportData.ca_untracked_recipes_ratio)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{menuCopy.splitNote}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-lg border border-border/60 p-4 space-y-2 lg:col-span-2 lg:min-h-[180px]">
          <CardHeader className="p-0 pb-2">{renderInfoHeader(menuCopy.averagesTitle, menuCopy.averagesTooltip)}</CardHeader>
          <CardContent className="space-y-6 p-0">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{menuCopy.averagesRevenueLabel}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold text-blue-500">{formatEuro(reportData.avg_revenue_per_dish)}</span>
                  {renderDelta(reportDeltas.avg_revenue_per_dish)}
                </div>
                </div>
                <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{menuCopy.averagesCostLabel}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold text-red-500">{formatEuro(reportData.avg_cost_per_dish)}</span>
                  {renderDelta(reportDeltas.avg_cost_per_dish)}
                </div>
                </div>
                <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{menuCopy.averagesMarginLabel}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-semibold text-green-500">{formatEuro(reportData.avg_margin_per_dish)}</span>
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
          <CardHeader className="p-0">{renderInfoHeader(menuCopy.theoreticalTitle, menuCopy.theoreticalTooltip)}</CardHeader>
          <CardContent className="grid gap-4 p-0 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{menuCopy.theoreticalSalesLabel}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold">{formatEuro(reportData.theoretical_sales_solid)}</span>
                {renderDelta(reportDeltas.theoretical_sales_solid)}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{menuCopy.theoreticalCostLabel}</p>
              <div className="flex items-baseline gap-3">
                <span className="text-[18px] font-semibold">{formatEuro(reportData.theoretical_material_cost_solid)}</span>
                {renderDelta(reportDeltas.theoretical_material_cost_solid)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    ),
  } as const

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-10 w-10">
          <Link to="/dashboard/performance/reports">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div className="flex-1 space-y-1">
          <h1 className="text-2xl font-semibold">Rapport Mars 2025</h1>
          <p className="text-sm text-muted-foreground">Dernière modification : Samedi 20 Décembre 2025</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <FilePenLine className="h-4 w-4" />
            Modifier le rapport
          </Button>
          <Button variant="destructive" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <Card className="bg-transparent p-4">
        <CardHeader className="flex flex-col gap-4 p-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{reportMonth}</p>
            <CardTitle>Performances générales</CardTitle>
          </div>
          <div className="flex w-full flex-wrap items-stretch justify-start gap-3 lg:w-auto lg:justify-end">
            {performanceMetrics.map((metric) => {
              const delta = metric.delta
              const hasDelta = typeof delta === "number" && Number.isFinite(delta)
              const isPositive = hasDelta ? delta >= 0 : null
              const deltaLabel = hasDelta
                ? `${isPositive ? "+" : "-"}${formatPercent(Math.abs(delta))}`
                : "-"

              return (
                <Card
                  key={metric.id}
                  className="w-full rounded-md border border-border/60 sm:w-[200px]"
                >
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
                          className={`text-sm font-medium ${
                            isPositive ? "text-green-500" : "text-red-500"
                          }`}
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

      <Card>
        <CardHeader>
          <CardTitle>Données financières</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="space-y-2 md:pr-2">
              {sidebarItems.map((item) => {
                const isActive = activeSection === item.id
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-2 ${
                      isActive ? "" : "text-muted-foreground"
                    }`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    {isActive ? <ChevronRight className="ml-auto h-4 w-4" /> : null}
                  </Button>
                )
              })}
            </div>
            <div className="space-y-3">{sectionContent[activeSection]}</div>
          </div>
          <Card className="mt-4 rounded-lg">
            <CardContent className="flex items-start gap-6 p-4">
              <div className="-mt-4 -mb-2 flex flex-col items-center">
                <Avatar className="h-22 w-22">
                  <AvatarImage src={ConsultantAvatar} alt="Consultant" className="bg-transparent" />
                </Avatar>
                <p className="text-xs text-muted-foreground -mt-1">Le consultant</p>
              </div>
              <div className="flex-1 space-y-2 self-center">
                <p className="text-base">{consultantCopy.lead}</p>
                <p className="text-sm text-muted-foreground">{consultantCopy.tail}</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
