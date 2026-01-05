import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  BookMarked,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Info,
  Loader2,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { type ChartConfig } from "@/components/ui/chart"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { type TooltipProps } from "recharts"
import ConsultantAvatar from "@/assets/avatar.png"
import { useEstablishment } from "@/context/EstablishmentContext"
import {
  deleteFinancialReport,
  getReportMonthDate,
  normalizePercent,
  submitFinancialReport,
  usePerformanceReportDetailData,
} from "./api"
import ReportDetailHeader from "./components/ReportDetailHeader"
import ReportEditDialog from "./components/ReportEditDialog"
import ReportPerformanceMetrics from "./components/ReportPerformanceMetrics"
import ReportSectionsCard from "./components/ReportSectionsCard"
import ReportAnnexesCard from "./components/ReportAnnexesCard"
import CostsSection from "./components/CostsSection"
import MarginsSection from "./components/MarginsSection"
import LaborSection from "./components/LaborSection"
import MenuSection from "./components/MenuSection"

const formatMonthLabel = (date: Date) => {
  const formatted = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function PerformancesReportsDetailsPage() {
  const { id: reportId } = useParams()
  const navigate = useNavigate()
  const { estId } = useEstablishment()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const {
    report,
    reports,
    financialIngredients,
    financialRecipes,
    masterArticles,
    suppliers,
    recipes,
    recipeCategories,
    recipeSubcategories,
    reportableRecipes,
    isLoading,
    error,
    reload,
  } = usePerformanceReportDetailData(reportId)

  const reportMonthDate = report ? getReportMonthDate(report) : null
  const reportMonth = reportMonthDate ? formatMonthLabel(reportMonthDate) : "Période"
  const reportUpdatedDate = report?.updated_at ? new Date(report.updated_at) : reportMonthDate
  const reportUpdatedLabel = reportUpdatedDate
    ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(
        reportUpdatedDate
      )
    : "--"

  const safeNumber = (value?: number | null) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0
  const safeRatio = (value?: number | null) => normalizePercent(safeNumber(value))

  const reportData = {
    ca_total_ht: safeNumber(report?.ca_total_ht),
    ca_tracked_recipes_ratio: safeRatio(report?.ca_tracked_recipes_ratio),
    ca_untracked_recipes_ratio: safeRatio(report?.ca_untracked_recipes_ratio),
    ca_tracked_recipes_total: safeNumber(report?.ca_tracked_recipes_total),
    ca_untracked_recipes_total: safeNumber(report?.ca_untracked_recipes_total),
    material_cost_total: safeNumber(report?.material_cost_total),
    material_cost_ratio: safeRatio(report?.material_cost_ratio),
    material_cost_ratio_solid: safeRatio(report?.material_cost_ratio_solid),
    material_cost_ratio_liquid: safeRatio(report?.material_cost_ratio_liquid),
    material_cost_solid: safeNumber(report?.material_cost_solid),
    material_cost_liquid: safeNumber(report?.material_cost_liquid),
    labor_cost_total: safeNumber(report?.labor_cost_total),
    labor_cost_ratio: safeRatio(report?.labor_cost_ratio),
    production_cost_total: safeNumber(report?.production_cost_total),
    production_cost_ratio: safeRatio(report?.production_cost_ratio),
    fixed_charges_total: safeNumber(report?.fixed_charges_total),
    fixed_charges_ratio: safeRatio(report?.fixed_charges_ratio),
    other_charges_total: safeNumber(report?.other_charges_total),
    other_charges_ratio: safeRatio(report?.other_charges_ratio),
    variable_charges_total: safeNumber(report?.variable_charges_total),
    variable_charges_ratio: safeRatio(report?.variable_charges_ratio),
    revenue_per_employee: safeNumber(report?.revenue_per_employee),
    result_per_employee: safeNumber(report?.result_per_employee),
    salary_per_employee: safeNumber(report?.salary_per_employee),
    avg_revenue_per_dish: safeNumber(report?.avg_revenue_per_dish),
    avg_cost_per_dish: safeNumber(report?.avg_cost_per_dish),
    avg_margin_per_dish: safeNumber(report?.avg_margin_per_dish),
    avg_margin_delta: safeNumber(report?.avg_margin_delta),
    theoretical_sales_solid: safeNumber(report?.theoretical_sales_solid),
    theoretical_material_cost_solid: safeNumber(report?.theoretical_material_cost_solid),
    commercial_margin_total: safeNumber(report?.commercial_margin_total),
    commercial_margin_total_ratio: safeRatio(report?.commercial_margin_total_ratio),
    commercial_margin_solid_ratio: safeRatio(report?.commercial_margin_solid_ratio),
    commercial_margin_liquid_ratio: safeRatio(report?.commercial_margin_liquid_ratio),
    commercial_margin_solid: safeNumber(report?.commercial_margin_solid),
    commercial_margin_liquid: safeNumber(report?.commercial_margin_liquid),
    multiplier_solid: safeNumber(report?.multiplier_solid),
    multiplier_liquid: safeNumber(report?.multiplier_liquid),
    multiplier_global: safeNumber(report?.multiplier_global),
    ebitda: safeNumber(report?.ebitda),
    ebitda_ratio: safeRatio(report?.ebitda_ratio),
    break_even_point: safeNumber(report?.break_even_point),
    safety_margin: safeNumber(report?.safety_margin),
    safety_margin_ratio: safeRatio(report?.safety_margin_ratio),
  }

  const otherChargesTotal = Math.max(
    reportData.production_cost_total - reportData.material_cost_total - reportData.labor_cost_total,
    0
  )
  const otherChargesRatio = reportData.ca_total_ht
    ? (otherChargesTotal / reportData.ca_total_ht) * 100
    : 0

  const normalizeRatio = (ratio: number) => (ratio > 1 ? ratio / 100 : ratio)

  const materialSolidAmount =
    reportData.material_cost_solid ||
    reportData.material_cost_total * normalizeRatio(reportData.material_cost_ratio_solid)
  const materialLiquidAmount =
    reportData.material_cost_liquid ||
    reportData.material_cost_total * normalizeRatio(reportData.material_cost_ratio_liquid)

  const marginSolidAmount =
    reportData.commercial_margin_solid ||
    reportData.commercial_margin_total * normalizeRatio(reportData.commercial_margin_solid_ratio)
  const marginLiquidAmount =
    reportData.commercial_margin_liquid ||
    reportData.commercial_margin_total * normalizeRatio(reportData.commercial_margin_liquid_ratio)

  const menuFixedAmount =
    reportData.ca_tracked_recipes_total ||
    reportData.ca_total_ht * normalizeRatio(reportData.ca_tracked_recipes_ratio)
  const menuVariableAmount =
    reportData.ca_untracked_recipes_total ||
    reportData.ca_total_ht * normalizeRatio(reportData.ca_untracked_recipes_ratio)

  const sortedReports = useMemo(() => {
    return reports
      .map((item) => ({ report: item, monthDate: getReportMonthDate(item) }))
      .filter((item): item is { report: typeof reports[number]; monthDate: Date } => Boolean(item.monthDate))
      .sort((a, b) => b.monthDate.getTime() - a.monthDate.getTime())
  }, [reports])

  const previousReport = useMemo(() => {
    if (!report) return null
    const currentIndex = sortedReports.findIndex((item) => item.report.id === report.id)
    if (currentIndex === -1) return null
    return sortedReports[currentIndex + 1]?.report ?? null
  }, [report, sortedReports])

  const previousData = previousReport
    ? {
        ca_total_ht: safeNumber(previousReport.ca_total_ht),
        labor_cost_total: safeNumber(previousReport.labor_cost_total),
        variable_charges_total: safeNumber(previousReport.variable_charges_total),
        material_cost_total: safeNumber(previousReport.material_cost_total),
        production_cost_total: safeNumber(previousReport.production_cost_total),
        fixed_charges_total: safeNumber(previousReport.fixed_charges_total),
        other_charges_total: safeNumber(previousReport.other_charges_total),
        revenue_per_employee: safeNumber(previousReport.revenue_per_employee),
        result_per_employee: safeNumber(previousReport.result_per_employee),
        avg_revenue_per_dish: safeNumber(previousReport.avg_revenue_per_dish),
        avg_cost_per_dish: safeNumber(previousReport.avg_cost_per_dish),
        avg_margin_per_dish: safeNumber(previousReport.avg_margin_per_dish),
        theoretical_sales_solid: safeNumber(previousReport.theoretical_sales_solid),
        theoretical_material_cost_solid: safeNumber(previousReport.theoretical_material_cost_solid),
        commercial_margin_total: safeNumber(previousReport.commercial_margin_total),
        multiplier_solid: safeNumber(previousReport.multiplier_solid),
        multiplier_liquid: safeNumber(previousReport.multiplier_liquid),
        multiplier_global: safeNumber(previousReport.multiplier_global),
        ebitda: safeNumber(previousReport.ebitda),
        break_even_point: safeNumber(previousReport.break_even_point),
        safety_margin: safeNumber(previousReport.safety_margin),
      }
    : null

  const buildDelta = (current: number, previous: number) => {
    if (!Number.isFinite(previous) || previous === 0) return null
    return ((current - previous) / Math.abs(previous)) * 100
  }

  const reportDeltas = {
    revenue: previousData ? buildDelta(reportData.ca_total_ht, previousData.ca_total_ht) : null,
    labor: previousData ? buildDelta(reportData.labor_cost_total, previousData.labor_cost_total) : null,
    purchases: previousData
      ? buildDelta(reportData.variable_charges_total, previousData.variable_charges_total)
      : null,
    result: previousData ? buildDelta(reportData.ebitda, previousData.ebitda) : null,
    material_cost_total: previousData
      ? buildDelta(reportData.material_cost_total, previousData.material_cost_total)
      : null,
    labor_cost_total: previousData
      ? buildDelta(reportData.labor_cost_total, previousData.labor_cost_total)
      : null,
    production_cost_total: previousData
      ? buildDelta(reportData.production_cost_total, previousData.production_cost_total)
      : null,
    fixed_charges_total: previousData
      ? buildDelta(reportData.fixed_charges_total, previousData.fixed_charges_total)
      : null,
    other_charges_total: previousData
      ? buildDelta(reportData.other_charges_total, previousData.other_charges_total)
      : null,
    variable_charges_total: previousData
      ? buildDelta(reportData.variable_charges_total, previousData.variable_charges_total)
      : null,
    revenue_per_employee: previousData
      ? buildDelta(reportData.revenue_per_employee, previousData.revenue_per_employee)
      : null,
    result_per_employee: previousData
      ? buildDelta(reportData.result_per_employee, previousData.result_per_employee)
      : null,
    avg_revenue_per_dish: previousData
      ? buildDelta(reportData.avg_revenue_per_dish, previousData.avg_revenue_per_dish)
      : null,
    avg_cost_per_dish: previousData
      ? buildDelta(reportData.avg_cost_per_dish, previousData.avg_cost_per_dish)
      : null,
    avg_margin_per_dish: previousData
      ? buildDelta(reportData.avg_margin_per_dish, previousData.avg_margin_per_dish)
      : null,
    theoretical_sales_solid: previousData
      ? buildDelta(reportData.theoretical_sales_solid, previousData.theoretical_sales_solid)
      : null,
    theoretical_material_cost_solid: previousData
      ? buildDelta(reportData.theoretical_material_cost_solid, previousData.theoretical_material_cost_solid)
      : null,
    commercial_margin_total: previousData
      ? buildDelta(reportData.commercial_margin_total, previousData.commercial_margin_total)
      : null,
    multiplier_solid: previousData
      ? buildDelta(reportData.multiplier_solid, previousData.multiplier_solid)
      : null,
    multiplier_liquid: previousData
      ? buildDelta(reportData.multiplier_liquid, previousData.multiplier_liquid)
      : null,
    multiplier_global: previousData
      ? buildDelta(reportData.multiplier_global, previousData.multiplier_global)
      : null,
    ebitda: previousData ? buildDelta(reportData.ebitda, previousData.ebitda) : null,
    break_even_point: previousData
      ? buildDelta(reportData.break_even_point, previousData.break_even_point)
      : null,
    safety_margin: previousData ? buildDelta(reportData.safety_margin, previousData.safety_margin) : null,
    safety_margin_ratio: previousData
      ? buildDelta(reportData.safety_margin_ratio, safeRatio(previousReport?.safety_margin_ratio))
      : null,
  }

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
  const formatInputValue = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  const formatPercent = (value: number) =>
    `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(value)}%`
  const formatMultiplier = (value: number) =>
    `x${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value)}`
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
                {ratioText ? <span className="text-xs text-muted-foreground">{ratioText}</span> : null}
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
      tooltip: "Dépenses d'achats de matières premières (solides et liquides).",
      value: reportData.material_cost_total,
      delta: reportDeltas.material_cost_total,
      helper: "Coût matière total sur la période.",
    },
    labor: {
      title: "Salaires & charges",
      tooltip: "Salaires et charges sociales sur la période.",
      value: reportData.labor_cost_total,
      delta: reportDeltas.labor_cost_total,
      helper: ratioCopy(reportData.labor_cost_ratio),
    },
    production: {
      title: "Coût de revient",
      tooltip: "Coût complet de production (matières + main d'œuvre + charges).",
      value: reportData.production_cost_total,
      delta: reportDeltas.production_cost_total,
      helper: ratioCopy(reportData.production_cost_ratio),
    },
    occupancy: {
      title: "Coût d'occupation",
      tooltip: "Charges fixes liées aux locaux (loyer, assurances, énergie fixe).",
      value: reportData.fixed_charges_total,
      delta: reportDeltas.fixed_charges_total,
      helper: ratioCopy(reportData.fixed_charges_ratio),
    },
    other: {
      title: "Autres charge directes",
      tooltip: "Autres charges directes liées à l'exploitation.",
      value: otherChargesTotal,
      delta: reportDeltas.other_charges_total,
      helper: ratioCopy(otherChargesRatio),
    },
    overhead: {
      title: "Frais généraux",
      tooltip: "Charges variables de fonctionnement (services, petits achats, marketing).",
      value: reportData.other_charges_total,
      delta: reportDeltas.other_charges_total,
      helper: ratioCopy(reportData.other_charges_ratio),
    },
    operating: {
      title: "Coûts d'exploitation",
      tooltip: "Somme du coût de revient, du coût d'occupation et des frais généraux.",
      value: reportData.variable_charges_total,
      delta: reportDeltas.variable_charges_total,
      helper: ratioCopy(reportData.variable_charges_ratio),
    },
  }

  const marginsCopy = {
    commercialTitle: "Marge commerciale",
    commercialTooltip: "Répartition de la marge commerciale entre solide et liquide.",
    multiplierTitle: "Coefficient multiplicateur",
    multiplierTooltip: "Rapport entre prix de vente et coût d'achat par type.",
    multiplierSolidLabel: "Sur solide",
    multiplierLiquidLabel: "Sur liquide",
    multiplierSummary: "Votre coefficient multiplicateur global est de",
    multiplierSummarySuffix: ".",
    operatingTitle: "Marge opérationnelle",
    operatingTooltip: "Résultat opérationnel après coûts de production.",
    operatingNotePrefix: "Votre marge bénéficiaire représente",
    operatingNoteSuffix: "de votre chiffre d'affaires.",
    breakEvenTitle: "Seuil de rentabilité",
    breakEvenTooltip: "Chiffre d'affaires minimum pour couvrir l'ensemble des charges.",
    breakEvenNote: "En dessous de ce montant de CA, votre établissement subira des pertes.",
    safetyTitle: "Marge de sécurité",
    safetyTooltip: "Baisse d'activité supportable avant de passer en pertes.",
    safetyNotePrefix: "Une diminution de",
    safetyNoteSuffix: "de votre activité n'entraînera pas de conséquences financières graves.",
  }

  const laborCopy = {
    efficiencyTitle: "Efficacité des employés",
    efficiencyTooltip: "Indicateurs de performance par employé (revenu et résultat).",
    efficiencyRevenueLabel: "Revenus par employé",
    efficiencyResultLabel: "Résultat par employé",
    efficiencyNote: "Vos employés ont diminué leur productivité de -705,2 € ce mois-ci.",
    payrollTitle: "Salaires & charges",
    payrollTooltip: "Masse salariale totale et par employé.",
    payrollTotalLabel: "Masse salariale totale",
    payrollPerEmployeeLabel: "Masse salariale par employé",
    payrollNotePrefix: "Cette dépense représente",
    payrollNoteSuffix: "de votre chiffre d'affaires.",
  }

  const menuCopy = {
    splitTitle: "Carte fixe vs. variable",
    splitTooltip: "Part du chiffre d'affaires réalisée par la carte fixe vs variable.",
    splitVsLabel: "vs.",
    splitNote:
      "Répartition entre vos plats présents sur RAVY (carte fixe) et les autres (carte variable).",
    averagesTitle: "Moyenne par plat sur RAVY",
    averagesTooltip: "Moyennes par plat sur la période.",
    averagesRevenueLabel: "Revenu moyen",
    averagesCostLabel: "Coût moyen",
    averagesMarginLabel: "Marge moyenne",
    averagesNotePrefix: "Vous avez diminué votre marge par recette de",
    averagesNoteSuffix: "ce mois-ci.",
    theoreticalTitle: "Données théoriques",
    theoreticalTooltip: "Données théoriques issues des fiches recettes.",
    theoreticalSalesLabel: "Chiffre d'affaires alimentaire théorique",
    theoreticalCostLabel: "Coût matière solide théorique",
  }
  const recommendedTargets = {
    productionCostRatio: 65,
    multiplierSolid: 3.33,
    laborCostRatio: 35,
  }
  const recommendedLabels = {
    productionCostRatio: formatPercent(recommendedTargets.productionCostRatio),
    multiplierSolid: formatMultiplier(recommendedTargets.multiplierSolid),
    laborCostRatio: formatPercent(recommendedTargets.laborCostRatio),
  }
  const consultantMessages = {
    costs: {
      ok: {
        title: "Coûts de revient maîtrisés",
        body:
          `Les coûts de revient doivent idéalement rester en dessous de ${recommendedLabels.productionCostRatio} de votre chiffre d’affaires. Vous êtes dans la bonne zone : conservez ce niveau en surveillant vos achats clés et en contrôlant les écarts de prix.`,
      },
      warn: {
        title: "Coûts de revient à optimiser",
        body:
          `Les coûts de revient doivent idéalement rester en dessous de ${recommendedLabels.productionCostRatio} de votre chiffre d’affaires. Si vous êtes au-dessus, travaillez en priorité la masse salariale et les achats stratégiques : une renégociation ciblée et un meilleur suivi des pertes peuvent rapidement améliorer votre marge.`,
      },
    },
    margins: {
      ok: {
        title: "Coef. multiplicateur solide conforme",
        body:
          `Le coefficient multiplicateur des solides doit idéalement être au-dessus de ${recommendedLabels.multiplierSolid}. Vous êtes dans les clous : maintenez vos prix de vente et veillez à la stabilité des coûts matière pour préserver cette performance.`,
      },
      warn: {
        title: "Coef. multiplicateur solide insuffisant",
        body:
          `Le coefficient multiplicateur des solides doit idéalement être au-dessus de ${recommendedLabels.multiplierSolid}. Si vous êtes en dessous, repositionnez certains prix de vente et réduisez les coûts matière via des alternatives fournisseurs ou une meilleure standardisation des portions.`,
      },
    },
    labor: {
      ok: {
        title: "Dépenses de personnel maîtrisées",
        body:
          `Les dépenses de personnel doivent idéalement rester en dessous de ${recommendedLabels.laborCostRatio} de votre chiffre d’affaires. Vous êtes dans la norme : continuez d’ajuster les plannings aux pics d’activité et suivez la productivité par service.`,
      },
      warn: {
        title: "Dépenses de personnel trop élevées",
        body:
          `Les dépenses de personnel doivent idéalement rester en dessous de ${recommendedLabels.laborCostRatio} de votre chiffre d’affaires. Si vous êtes au-dessus, améliorez la productivité et optimisez les plannings : mieux calibrer les équipes par créneau peut réduire rapidement le ratio.`,
      },
    },
    menu: {
      fixed: {
        title: "Carte fixe à optimiser",
        body:
          "Votre carte fixe pèse davantage dans le chiffre d’affaires. Concentrez vos actions sur ces articles : optimisez les achats, négociez les prix et standardisez les portions pour maximiser l’impact sur la marge.",
      },
      variable: {
        title: "Carte variable à optimiser",
        body:
          "Votre carte variable pèse davantage dans le chiffre d’affaires. Priorisez les articles les plus commandés hors carte fixe et renégociez les prix pour sécuriser la marge sur les volumes réels.",
      },
    },
  }
  const isCostsOk = reportData.production_cost_ratio <= recommendedTargets.productionCostRatio
  const isMarginsOk = reportData.multiplier_solid >= recommendedTargets.multiplierSolid
  const isLaborOk = reportData.labor_cost_ratio <= recommendedTargets.laborCostRatio
  const isMenuFixed = reportData.ca_tracked_recipes_ratio >= reportData.ca_untracked_recipes_ratio
  const consultantCopy = (() => {
    if (activeSection === "costs") {
      return isCostsOk ? consultantMessages.costs.ok : consultantMessages.costs.warn
    }
    if (activeSection === "margins") {
      return isMarginsOk ? consultantMessages.margins.ok : consultantMessages.margins.warn
    }
    if (activeSection === "labor") {
      return isLaborOk ? consultantMessages.labor.ok : consultantMessages.labor.warn
    }
    return isMenuFixed ? consultantMessages.menu.fixed : consultantMessages.menu.variable
  })()

  const sidebarItems = [
    { id: "costs" as const, label: "Analyse des coûts", icon: BanknoteArrowDown },
    { id: "margins" as const, label: "Marges et rentabilité", icon: BanknoteArrowUp },
    { id: "labor" as const, label: "Main d'œuvre", icon: Users },
    { id: "menu" as const, label: "Efficacité du menu", icon: BookMarked },
  ]

  const masterArticleById = useMemo(() => {
    return new Map(masterArticles.map((article) => [article.id, article]))
  }, [masterArticles])

  const ingredientsForReport = useMemo(() => {
    if (!report?.id) return []
    return financialIngredients.filter((item) => item.financial_report_id === report.id)
  }, [financialIngredients, report?.id])

  const theoreticalProducts = useMemo(() => {
    const formatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 })
    return ingredientsForReport.map((item) => {
      const masterArticle = item.master_article_id
        ? masterArticleById.get(item.master_article_id)
        : undefined
      const quantityValue = safeNumber(item.quantity)
      const consumedValue = safeNumber(item.consumed_value)
      const avgPrice = quantityValue ? consumedValue / quantityValue : 0
      const unit = masterArticle?.unit ?? ""
      const quantityLabel = quantityValue
        ? `${formatter.format(quantityValue)}${unit ? ` ${unit}` : ""}`
        : "--"

      return {
        id: item.id,
        name: masterArticle?.unformatted_name || masterArticle?.name || "Produit",
        supplierId: masterArticle?.supplier_id ?? "",
        avgPrice,
        consumptionHt: consumedValue,
        quantity: quantityLabel,
      }
    })
  }, [ingredientsForReport, masterArticleById])

  const supplierOptions = useMemo(() => {
    return suppliers
      .map((supplier) => ({ id: supplier.id, label: supplier.name ?? "Fournisseur" }))
      .filter((item) => item.id)
  }, [suppliers])

  const recipeById = useMemo(() => {
    return new Map(recipes.map((recipe) => [recipe.id, recipe]))
  }, [recipes])

  const recipesForReport = useMemo(() => {
    if (!report?.id) return []
    return financialRecipes.filter((item) => item.financial_report_id === report.id)
  }, [financialRecipes, report?.id])

  const recipesEfficiency = useMemo(() => {
    return recipesForReport.map((item) => {
      const recipe = item.recipe_id ? recipeById.get(item.recipe_id) : undefined
      const salesNumber = safeNumber(item.sales_number)
      const totalRevenue = safeNumber(item.total_revenue)
      const totalCost = safeNumber(item.total_cost)
      const avgCost = salesNumber ? totalCost / salesNumber : 0
      const revenueShare = reportData.ca_total_ht ? (totalRevenue / reportData.ca_total_ht) * 100 : 0

      return {
        id: item.id,
        name: recipe?.name ?? "Recette",
        category: recipe?.category_id ?? "__uncategorized__",
        subcategory: recipe?.subcategory_id ?? "__uncategorized__",
        avgCost,
        revenue: totalRevenue,
        revenueShare,
      }
    })
  }, [recipeById, recipesForReport, reportData.ca_total_ht])

  const categoryOptions = useMemo(() => {
    return recipeCategories
      .map((category) => ({ value: category.id, label: category.name ?? "Catégorie" }))
      .filter((item) => item.value)
  }, [recipeCategories])

  const subCategoryOptionsMap = useMemo(() => {
    const map: Record<string, { value: string; label: string }[]> = {}
    recipeSubcategories.forEach((subcategory) => {
      if (!subcategory.category_id) return
      if (!map[subcategory.category_id]) {
        map[subcategory.category_id] = []
      }
      map[subcategory.category_id].push({
        value: subcategory.id,
        label: subcategory.name ?? "Sous-catégorie",
      })
    })

    Object.values(map).forEach((entries) => {
      entries.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }))
    })

    return map
  }, [recipeSubcategories])

  const initialSalesByRecipe = useMemo(() => {
    const values: Record<string, string> = {}
    recipesForReport.forEach((item) => {
      if (!item.recipe_id) return
      const salesNumber = safeNumber(item.sales_number)
      values[item.recipe_id] = salesNumber ? `${Math.round(salesNumber)}` : ""
    })
    return values
  }, [recipesForReport])

  const initialFinancialInputs = useMemo(
    () => ({
      laborCost: formatInputValue(reportData.labor_cost_total),
      headcount: report?.fte_count ? `${Math.round(report.fte_count)}` : "",
      fixedCosts: formatInputValue(reportData.fixed_charges_total),
      variableCosts: formatInputValue(reportData.variable_charges_total),
      otherCosts: formatInputValue(reportData.other_charges_total),
      revenueFood: formatInputValue(menuFixedAmount),
      revenueTotal: formatInputValue(reportData.ca_total_ht),
    }),
    [
      menuFixedAmount,
      report?.fte_count,
      reportData.ca_total_ht,
      reportData.fixed_charges_total,
      reportData.labor_cost_total,
      reportData.other_charges_total,
      reportData.variable_charges_total,
    ]
  )

  const handleUpdateReport = async ({
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
  }

  const handleDeleteReport = async () => {
    if (!report?.id) return
    setIsDeleting(true)
    try {
      await deleteFinancialReport(report.id)
      toast.success("Rapport supprimé.")
      navigate("/dashboard/performance/reports")
    } catch {
      toast.error("Impossible de supprimer le rapport.")
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (isLoading && !report) {
    return <p className="text-sm text-muted-foreground">Chargement du rapport...</p>
  }

  if (!report) {
    return <p className="text-sm text-muted-foreground">Rapport introuvable.</p>
  }

  const sectionContent = {
    costs: (
      <CostsSection
        costMetrics={costMetrics}
        materialCostRatio={reportData.material_cost_ratio}
        materialsChartData={materialsChartData}
        materialsChartConfig={materialsChartConfig}
        ratioCopy={ratioCopy}
        renderInfoHeader={renderInfoHeader}
        renderDelta={renderDelta}
        formatEuro={formatEuro}
        pieTooltip={<PieTooltip />}
      />
    ),
    margins: (
      <MarginsSection
        marginsCopy={marginsCopy}
        marginChartData={marginChartData}
        marginChartConfig={marginChartConfig}
        reportData={reportData}
        reportDeltas={reportDeltas}
        formatEuro={formatEuro}
        formatPercent={formatPercent}
        formatDelta={formatDelta}
        ratioCopy={ratioCopy}
        renderInfoHeader={renderInfoHeader}
        renderDelta={renderDelta}
        deltaClass={deltaClass}
        pieTooltip={<PieTooltip />}
      />
    ),
    labor: (
      <LaborSection
        laborCopy={laborCopy}
        reportData={reportData}
        reportDeltas={reportDeltas}
        formatEuro={formatEuro}
        formatPercent={formatPercent}
        renderInfoHeader={renderInfoHeader}
        renderDelta={renderDelta}
      />
    ),
    menu: (
      <MenuSection
        menuCopy={menuCopy}
        reportData={reportData}
        reportDeltas={reportDeltas}
        menuChartData={menuChartData}
        menuChartConfig={menuChartConfig}
        formatEuro={formatEuro}
        formatPercent={formatPercent}
        renderInfoHeader={renderInfoHeader}
        renderDelta={renderDelta}
        pieTooltip={<PieTooltip />}
      />
    ),
  } as const

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ReportDetailHeader
        title={`Rapport ${reportMonth}`}
        subtitle={`Dernière modification : ${reportUpdatedLabel}`}
        backHref="/dashboard/performance/reports"
        onDelete={() => setDeleteOpen(true)}
        editDialog={
          <ReportEditDialog
            reportMonth={reportMonth}
            reportMonthDate={reportMonthDate}
            initialFinancialInputs={initialFinancialInputs}
            initialSalesByRecipe={initialSalesByRecipe}
            reportableRecipes={reportableRecipes}
            formatEuro={formatEuro}
            onSubmit={handleUpdateReport}
          />
        }
      />
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est definitive. Les données du rapport seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport} disabled={isDeleting} className="gap-2">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ReportPerformanceMetrics
        title="Performances générales"
        subtitle={reportMonth}
        metrics={performanceMetrics}
        formatEuro={formatEuro}
        formatPercent={formatPercent}
      />
      <ReportSectionsCard
        title="Données financières"
        sidebarItems={sidebarItems}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        activeContent={sectionContent[activeSection]}
        consultant={consultantCopy}
        consultantAvatarSrc={ConsultantAvatar}
      />
      <ReportAnnexesCard
        reportMonth={reportMonth}
        supplierOptions={supplierOptions}
        theoreticalProducts={theoreticalProducts}
        recipesEfficiency={recipesEfficiency}
        categoryOptions={categoryOptions}
        subCategoryOptionsMap={subCategoryOptionsMap}
        formatEuro={formatEuro}
      />
    </div>
  )
}
