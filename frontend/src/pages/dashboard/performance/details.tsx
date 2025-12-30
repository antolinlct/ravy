import { useState } from "react"
import {
  BookMarked,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Info,
  Users,
} from "lucide-react"

import { type ChartConfig } from "@/components/ui/chart"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { type TooltipProps } from "recharts"
import ConsultantAvatar from "@/assets/avatar.png"
import ReportDetailHeader from "./components/ReportDetailHeader"
import ReportEditDialog from "./components/ReportEditDialog"
import ReportPerformanceMetrics from "./components/ReportPerformanceMetrics"
import ReportSectionsCard from "./components/ReportSectionsCard"
import ReportAnnexesCard from "./components/ReportAnnexesCard"
import CostsSection from "./components/CostsSection"
import MarginsSection from "./components/MarginsSection"
import LaborSection from "./components/LaborSection"
import MenuSection from "./components/MenuSection"

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
  const reportableRecipes = [
    { id: "aiguillettes", name: "Aiguillettes de poulet", price: 9.0 },
    { id: "andouillette", name: "Andouillette", price: 20.9 },
    { id: "bavette", name: "Bavette de boeuf, frites", price: 21.9 },
    { id: "camembert", name: "Camembert roti", price: 10.0 },
    { id: "bruschetta", name: "Bruschetta", price: 9.0 },
    { id: "burger", name: "Burger Tradition", price: 17.9 },
    { id: "creme", name: "Creme caramel", price: 8.0 },
    { id: "salade", name: "Salade Lyonnaise XL", price: 14.5 },
  ]
  const initialFinancialInputs = {
    laborCost: formatInputValue(reportData.labor_cost_total),
    headcount: "8",
    fixedCosts: formatInputValue(reportData.fixed_charges_total),
    variableCosts: formatInputValue(reportData.variable_charges_total),
    otherCosts: formatInputValue(reportData.other_charges_total),
    revenueFood: formatInputValue(menuFixedAmount),
    revenueTotal: formatInputValue(reportData.ca_total_ht),
  }
  const initialSalesByRecipe: Record<string, string> = {
    aiguillettes: "120",
    andouillette: "48",
    bavette: "62",
    camembert: "30",
    bruschetta: "42",
    burger: "55",
    creme: "80",
    salade: "25",
  }

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
    safetyAmountLabel: "Montant",
    safetyPercentLabel: "Pourcentage",
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

  const supplierOptions = [
    { id: "sysco", label: "Sysco France" },
    { id: "distriporc", label: "Distriporc" },
    { id: "dc-plateforme", label: "DC PLATEFORME" },
    { id: "brake", label: "Brake" },
  ]

  const theoreticalProducts = [
    {
      id: "bavette",
      name: "BAVETTE PAD FR SOUS VIDE",
      supplierId: "sysco",
      avgPrice: 17.955,
      consumptionHt: 197.51,
      quantity: "11 kg",
    },
    {
      id: "batavia",
      name: "BATAVIA BRUNE CAT 1 FRANCE",
      supplierId: "sysco",
      avgPrice: 1.15,
      consumptionHt: 66.58,
      quantity: "58 p",
    },
    {
      id: "chene",
      name: "CHENE BL CAT 1 FRANCE",
      supplierId: "dc-plateforme",
      avgPrice: 1.15,
      consumptionHt: 66.07,
      quantity: "57 p",
    },
    {
      id: "pesto",
      name: "PESTO VERDE 470G BKE X6",
      supplierId: "distriporc",
      avgPrice: 6.9,
      consumptionHt: 15.25,
      quantity: "2 pc",
    },
    {
      id: "tomate",
      name: "TOMATE CONFITE NAT. CBR BQ1KG X4",
      supplierId: "brake",
      avgPrice: 0,
      consumptionHt: 0,
      quantity: "1 kg",
    },
    {
      id: "mozzarella",
      name: "MOZZARELLA 18%MG MIN. ST125G X20",
      supplierId: "sysco",
      avgPrice: 1.1,
      consumptionHt: 9.35,
      quantity: "9 st",
    },
    {
      id: "camembert",
      name: "CAMEMBERT AU FOUR 45%MG 120G",
      supplierId: "brake",
      avgPrice: 12.31,
      consumptionHt: 43.95,
      quantity: "4 ct",
    },
  ]

  const recipesEfficiency = [
    {
      id: "steak",
      name: "Steak haché, frites",
      category: "plats",
      subcategory: "grillades",
      avgCost: 3.197,
      revenue: 1571.27,
      revenueShare: 2.0,
    },
    {
      id: "bavette",
      name: "Bavette de bœuf, frites",
      category: "plats",
      subcategory: "boucherie",
      avgCost: 4.903,
      revenue: 995.45,
      revenueShare: 1.3,
    },
    {
      id: "salade",
      name: "Salade Lyonnaise XL",
      category: "entrees",
      subcategory: "salades",
      avgCost: 2.537,
      revenue: 695.0,
      revenueShare: 0.9,
    },
    {
      id: "tartare",
      name: "Tartare bœuf 200g",
      category: "plats",
      subcategory: "tartares",
      avgCost: 3.497,
      revenue: 656.36,
      revenueShare: 0.8,
    },
    {
      id: "moelleux",
      name: "Moelleux chocolat",
      category: "desserts",
      subcategory: "tartes",
      avgCost: 1.957,
      revenue: 581.82,
      revenueShare: 0.7,
    },
    {
      id: "tartare-300",
      name: "Tartare bœuf 300g",
      category: "plats",
      subcategory: "boucherie",
      avgCost: 4.771,
      revenue: 397.27,
      revenueShare: 0.5,
    },
    {
      id: "tarte-citron",
      name: "Tarte citron",
      category: "desserts",
      subcategory: "tartes",
      avgCost: 0.995,
      revenue: 269.09,
      revenueShare: 0.3,
    },
  ]


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
      <ReportDetailHeader
        title="Rapport Mars 2025"
        subtitle="Dernière modification : Samedi 20 Décembre 2025"
        backHref="/dashboard/performance/reports"
        editDialog={
          <ReportEditDialog
            reportMonth={reportMonth}
            initialFinancialInputs={initialFinancialInputs}
            initialSalesByRecipe={initialSalesByRecipe}
            reportableRecipes={reportableRecipes}
            formatEuro={formatEuro}
          />
        }
      />
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
        formatEuro={formatEuro}
      />
    </div>
  )
}
