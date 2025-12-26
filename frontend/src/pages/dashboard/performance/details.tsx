import { useMemo, useState, type ChangeEvent } from "react"
import { Link } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  FilePenLine,
  BookMarked,
  BanknoteArrowDown,
  BanknoteArrowUp,
  Info,
  Trash2,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  const [annexesOpen, setAnnexesOpen] = useState(false)
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("__all__")
  const [selectedSubCategory, setSelectedSubCategory] = useState("__all__")
  const [productSortKey, setProductSortKey] = useState<"name" | "consumption" | null>(null)
  const [productSortDirection, setProductSortDirection] = useState<"none" | "asc" | "desc">("none")
  const [recipeSortKey, setRecipeSortKey] = useState<"name" | "revenue" | null>(null)
  const [recipeSortDirection, setRecipeSortDirection] = useState<"none" | "asc" | "desc">("none")
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
  const [editOpen, setEditOpen] = useState(false)
  const [financialInputs, setFinancialInputs] = useState({
    laborCost: formatInputValue(reportData.labor_cost_total),
    headcount: "8",
    fixedCosts: formatInputValue(reportData.fixed_charges_total),
    variableCosts: formatInputValue(reportData.variable_charges_total),
    otherCosts: formatInputValue(reportData.other_charges_total),
    revenueFood: formatInputValue(menuFixedAmount),
    revenueTotal: formatInputValue(reportData.ca_total_ht),
  })
  const [salesByRecipe, setSalesByRecipe] = useState<Record<string, string>>({
    aiguillettes: "120",
    andouillette: "48",
    bavette: "62",
    camembert: "30",
    bruschetta: "42",
    burger: "55",
    creme: "80",
    salade: "25",
  })
  const [showEditValidation, setShowEditValidation] = useState(false)
  const hasAtLeastOneSale = useMemo(
    () => Object.values(salesByRecipe).some((value) => Number(value) >= 1),
    [salesByRecipe]
  )
  const isFinancialComplete = useMemo(
    () => Object.values(financialInputs).every((value) => value.trim() !== ""),
    [financialInputs]
  )
  const isEditReady = isFinancialComplete && hasAtLeastOneSale
  const showFinancialErrors = showEditValidation && !isFinancialComplete
  const showSalesError = showEditValidation && !hasAtLeastOneSale
  const requiredInputClass = (value: string) =>
    showFinancialErrors && !value.trim() ? "border-destructive focus-visible:ring-destructive" : ""
  const handleFinancialInput =
    (key: keyof typeof financialInputs) => (event: ChangeEvent<HTMLInputElement>) => {
      setFinancialInputs((prev) => ({ ...prev, [key]: event.target.value }))
    }
  const handleSalesInput = (recipeId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setSalesByRecipe((prev) => ({ ...prev, [recipeId]: event.target.value }))
  }
  const handleEditAttempt = () => {
    if (!isEditReady) {
      setShowEditValidation(true)
      toast.error("Modification du rapport impossible.")
      return
    }
    toast.success(
      <>
        Le rapport du mois de <span className="font-semibold">{reportMonth}</span> a été modifié.
      </>
    )
    setEditOpen(false)
    setShowEditValidation(false)
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

  const filteredProducts = selectedSupplierId
    ? theoreticalProducts.filter((product) => product.supplierId === selectedSupplierId)
    : theoreticalProducts

  const categoryOptions = [
    { value: "__all__", label: "Toutes les catégories" },
    { value: "plats", label: "Plats" },
    { value: "entrees", label: "Entrées" },
    { value: "desserts", label: "Desserts" },
    { value: "snacking", label: "Snacking" },
  ]

  const subCategoryOptionsMap: Record<string, { value: string; label: string }[]> = {
    plats: [
      { value: "grillades", label: "Grillades" },
      { value: "boucherie", label: "Boucherie" },
      { value: "poisson", label: "Poisson" },
    ],
    entrees: [
      { value: "salades", label: "Salades" },
      { value: "tartares", label: "Tartares" },
    ],
    desserts: [
      { value: "tartes", label: "Tartes" },
      { value: "glaces", label: "Glaces" },
    ],
    snacking: [
      { value: "burgers", label: "Burgers" },
      { value: "sandwiches", label: "Sandwiches" },
    ],
  }

  const filteredSubCategoryOptions =
    selectedCategory === "__all__" ? [] : subCategoryOptionsMap[selectedCategory] ?? []

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

  const filteredRecipes = recipesEfficiency.filter((recipe) => {
    const matchesCategory = selectedCategory === "__all__" || recipe.category === selectedCategory
    const matchesSubCategory = selectedSubCategory === "__all__" || recipe.subcategory === selectedSubCategory
    return matchesCategory && matchesSubCategory
  })
  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts]
    if (!productSortKey || productSortDirection === "none") return items
    const direction = productSortDirection === "asc" ? 1 : -1
    return items.sort((a, b) => {
      if (productSortKey === "name") {
        return a.name.localeCompare(b.name, "fr", { sensitivity: "base" }) * direction
      }
      return (a.consumptionHt - b.consumptionHt) * direction
    })
  }, [filteredProducts, productSortKey, productSortDirection])
  const sortedRecipes = useMemo(() => {
    const items = [...filteredRecipes]
    if (!recipeSortKey || recipeSortDirection === "none") return items
    const direction = recipeSortDirection === "asc" ? 1 : -1
    return items.sort((a, b) => {
      if (recipeSortKey === "name") {
        return a.name.localeCompare(b.name, "fr", { sensitivity: "base" }) * direction
      }
      return (a.revenue - b.revenue) * direction
    })
  }, [filteredRecipes, recipeSortKey, recipeSortDirection])
  const renderSortIcon = (
    activeKey: string | null,
    direction: "none" | "asc" | "desc",
    key: string
  ) => {
    if (activeKey !== key || direction === "none") {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
    }
    return direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    )
  }
  const toggleProductSort = (key: "name" | "consumption") => {
    if (productSortKey !== key) {
      setProductSortKey(key)
      setProductSortDirection("asc")
      return
    }
    setProductSortDirection((current) => {
      if (current === "none") return "asc"
      if (current === "asc") return "desc"
      setProductSortKey(null)
      return "none"
    })
  }
  const toggleRecipeSort = (key: "name" | "revenue") => {
    if (recipeSortKey !== key) {
      setRecipeSortKey(key)
      setRecipeSortDirection("asc")
      return
    }
    setRecipeSortDirection((current) => {
      if (current === "none") return "asc"
      if (current === "asc") return "desc"
      setRecipeSortKey(null)
      return "none"
    })
  }

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
          <Dialog
            open={editOpen}
            onOpenChange={(open) => {
              setEditOpen(open)
              if (!open) {
                setShowEditValidation(false)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FilePenLine className="h-4 w-4" />
                Modifier le rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] max-h-[82vh] overflow-y-auto">
              <DialogHeader className="space-y-2">
                <DialogTitle>Modifier un rapport financier</DialogTitle>
                <DialogDescription>
                  Modifiez les ventes et les données financières du rapport.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
                <div className="space-y-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Card className="border-border/60">
                          <CardHeader className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-1">
                                <CardTitle>Période d&apos;activité</CardTitle>
                                <p className="text-sm text-muted-foreground">Mois du rapport</p>
                              </div>
                              <Select value={reportMonth} onValueChange={() => undefined} disabled>
                                <SelectTrigger className="w-[160px]" disabled>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={reportMonth}>{reportMonth}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </CardHeader>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Pour modifier le mois d&apos;un rapport, il faut le supprimer ou en créer un nouveau directement.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Card className="border-border/60">
                    <CardHeader className="p-4">
                      <CardTitle>Données financières</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Modifiez les informations financières du rapport.
                      </p>
                    </CardHeader>
                    <TooltipProvider delayDuration={100}>
                      <CardContent className="space-y-4 p-4 pt-0">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Main d&apos;oeuvre</Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0,00"
                                    className={`pr-8 ${requiredInputClass(financialInputs.laborCost)}`}
                                    required
                                    value={financialInputs.laborCost}
                                    onChange={handleFinancialInput("laborCost")}
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    €
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Montant total des salaires et charges sociales du mois.
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Nombre ETP</Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0"
                                    className={`pr-24 ${requiredInputClass(financialInputs.headcount)}`}
                                    required
                                    value={financialInputs.headcount}
                                    onChange={handleFinancialInput("headcount")}
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    personnes
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Nombre equivalent temps plein sur la periode.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Separator />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Charges fixes</Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0,00"
                                    className={`pr-8 ${requiredInputClass(financialInputs.fixedCosts)}`}
                                    required
                                    value={financialInputs.fixedCosts}
                                    onChange={handleFinancialInput("fixedCosts")}
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    €
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Charges fixes liées à votre activité (loyer, intérêts, etc.).
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">Charges variables</Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0,00"
                                    className={`pr-8 ${requiredInputClass(financialInputs.variableCosts)}`}
                                    required
                                    value={financialInputs.variableCosts}
                                    onChange={handleFinancialInput("variableCosts")}
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    €
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Charges variables selon votre niveau d&apos;activité (gaz, énergies, etc.).
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2 sm:col-span-2">
                                <Label className="text-xs font-medium text-muted-foreground">Autres charges</Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0,00"
                                    className={`pr-8 ${requiredInputClass(financialInputs.otherCosts)}`}
                                    required
                                    value={financialInputs.otherCosts}
                                    onChange={handleFinancialInput("otherCosts")}
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    €
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Autres charges exceptionnelles ou ponctuelles du mois.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Separator />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Chiffre d&apos;affaires solide HT
                                </Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0,00"
                                    className={`pr-8 ${requiredInputClass(financialInputs.revenueFood)}`}
                                    required
                                    value={financialInputs.revenueFood}
                                    onChange={handleFinancialInput("revenueFood")}
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    €
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Chiffre d&apos;affaires hors taxes sur vos ventes de plats solides.
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground">
                                  Chiffre d&apos;affaires total HT
                                </Label>
                                <div className="relative">
                                  <Input
                                    placeholder="0,00"
                                    className={`pr-8 ${requiredInputClass(financialInputs.revenueTotal)}`}
                                    required
                                    value={financialInputs.revenueTotal}
                                    onChange={handleFinancialInput("revenueTotal")}
                                  />
                                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                                    €
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Chiffre d&apos;affaires HT total (solide + liquide).
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </CardContent>
                    </TooltipProvider>
                  </Card>
                </div>

                <Card
                  className={`border-border/60 bg-transparent shadow-none ${
                    showSalesError ? "border-destructive" : ""
                  }`}
                >
                  <CardHeader className="space-y-1 p-4 pb-6 pt-6">
                    <CardTitle>Récapitulatif de vos ventes</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Indiquez le nombre de ventes par recette effectuées sur {reportMonth}.
                    </p>
                  </CardHeader>
                  <CardContent className="overflow-hidden p-0">
                    <Table className="w-full table-fixed">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-3 text-left">Recette</TableHead>
                          <TableHead className="w-[140px] text-left">Prix de vente</TableHead>
                          <TableHead className="w-[160px] pr-3 text-left">Nombre vendu</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <ScrollArea className="h-[360px]">
                      <Table className="w-full table-fixed">
                        <TableBody>
                          {[...reportableRecipes]
                            .sort((a, b) => a.name.localeCompare(b.name, "fr"))
                            .map((recipe) => (
                              <TableRow key={recipe.id}>
                                <TableCell className="pl-3">
                                  <p className="text-sm font-medium">{recipe.name}</p>
                                </TableCell>
                                <TableCell className="w-[140px] text-left">
                                  <Badge variant="secondary" className="text-sm font-semibold">
                                    {formatEuro(recipe.price)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="w-[160px] pr-3 text-left">
                                  <Input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    min={0}
                                    step={1}
                                    placeholder="Indiquez ici"
                                    className="w-[110px]"
                                    value={salesByRecipe[recipe.id] ?? ""}
                                    onChange={handleSalesInput(recipe.id)}
                                    onKeyDown={(event) => {
                                      if ([".", ",", "e", "E", "+", "-"].includes(event.key)) {
                                        event.preventDefault()
                                      }
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditOpen(false)}>
                  Annuler
                </Button>
                <Button
                  onClick={handleEditAttempt}
                  aria-disabled={!isEditReady}
                  className={!isEditReady ? "cursor-not-allowed opacity-50" : ""}
                >
                  Modifier le rapport
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <p className="text-base font-semibold">{consultantCopy.title}</p>
                <p className="text-sm text-muted-foreground">{consultantCopy.body}</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Informations annexes</CardTitle>
            <p className="text-sm text-muted-foreground">Détails complémentaires sur le rapport</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAnnexesOpen((prev) => !prev)}
            aria-expanded={annexesOpen}
          >
            {annexesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="sr-only">
              {annexesOpen ? "Réduire les informations annexes" : "Afficher les informations annexes"}
            </span>
          </Button>
        </CardHeader>
        {annexesOpen ? (
          <CardContent className="pt-0">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-lg border-0 bg-muted/40 p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-base font-semibold">
                    Consommation théorique de vos produits du mois de {reportMonth}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Fournisseur</p>
                  <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={supplierSearchOpen}
                        className="w-full justify-between"
                      >
                        {selectedSupplierId
                          ? supplierOptions.find((opt) => opt.id === selectedSupplierId)?.label
                          : "Tous les fournisseurs"}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Rechercher un fournisseur..." className="h-9" />
                        <CommandList>
                          <CommandEmpty>Aucun fournisseur trouvé.</CommandEmpty>
                          <CommandGroup>
                            {supplierOptions.map((opt) => (
                              <CommandItem
                                key={opt.id}
                                value={opt.label}
                                onSelect={() => {
                                  setSelectedSupplierId(selectedSupplierId === opt.id ? "" : opt.id)
                                  setSupplierSearchOpen(false)
                                }}
                              >
                                {opt.label}
                                <Check
                                  className={`ml-auto h-4 w-4 ${
                                    selectedSupplierId === opt.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="pl-4">
                        <TableHead className="pl-4 text-left w-[60%]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-fit justify-start gap-2 px-0 text-left font-semibold"
                            onClick={() => toggleProductSort("name")}
                          >
                            <span className="mr-1 truncate">Produits</span>
                            {renderSortIcon(productSortKey, productSortDirection, "name")}
                          </Button>
                        </TableHead>
                        <TableHead className="pr-4 text-right w-[40%]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-8 w-fit justify-end gap-2 px-0 text-right font-semibold"
                            onClick={() => toggleProductSort("consumption")}
                          >
                            <span className="mr-1 truncate">Consommation HT</span>
                            {renderSortIcon(productSortKey, productSortDirection, "consumption")}
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                  <ScrollArea className="h-[380px]">
                    <Table className="table-fixed">
                      <TableBody>
                        {sortedProducts.length ? (
                          sortedProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="pl-4 align-top w-[60%]">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Prix achat moyen:{" "}
                                    <span className="text-red-500">{formatEuro(product.avgPrice)}</span>
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="pr-4 text-right align-top w-[40%]">
                                <div className="space-y-1 text-right">
                                  <Badge variant="secondary" className="text-sm font-semibold">
                                    {formatEuro(product.consumptionHt)}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">Qté. consommée: {product.quantity}</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="px-4 py-6 text-sm text-muted-foreground">
                              Aucun produit pour ces filtres.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </Card>
              <Card className="rounded-lg border-0 bg-muted/40 p-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-base font-semibold">
                    Efficacité de vos recettes du mois de {reportMonth}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Catégorie</p>
                    <Select
                      value={selectedCategory}
                      onValueChange={(value) => {
                        setSelectedCategory(value)
                        setSelectedSubCategory("__all__")
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className={opt.value === "__all__" ? "text-muted-foreground" : undefined}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Sous-catégorie</p>
                    <Select value={selectedSubCategory} onValueChange={setSelectedSubCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les sous-catégories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="__all__"
                          className="text-muted-foreground focus:text-accent-foreground"
                        >
                          Toutes les sous-catégories
                        </SelectItem>
                        {selectedCategory === "__all__" ? (
                          <SelectItem value="__none__" disabled>
                            Aucune sous-catégorie disponible
                          </SelectItem>
                        ) : (
                          filteredSubCategoryOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="overflow-hidden rounded-lg border border-border/60">
                  <Table className="table-fixed">
                    <TableHeader>
                      <TableRow className="pl-4">
                        <TableHead className="pl-4 text-left w-[60%]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-fit justify-start gap-2 px-0 text-left font-semibold"
                            onClick={() => toggleRecipeSort("name")}
                          >
                            <span className="mr-1 truncate">Recettes</span>
                            {renderSortIcon(recipeSortKey, recipeSortDirection, "name")}
                          </Button>
                        </TableHead>
                        <TableHead className="pr-4 text-right w-[40%]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-8 w-fit justify-end gap-2 px-0 text-right font-semibold"
                            onClick={() => toggleRecipeSort("revenue")}
                          >
                            <span className="mr-1 truncate">Revenus HT</span>
                            {renderSortIcon(recipeSortKey, recipeSortDirection, "revenue")}
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                  </Table>
                  <ScrollArea className="h-[380px]">
                    <Table className="table-fixed">
                      <TableBody>
                        {sortedRecipes.length ? (
                          sortedRecipes.map((recipe) => (
                            <TableRow key={recipe.id}>
                              <TableCell className="pl-4 align-top w-[60%]">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{recipe.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Coût moyen:{" "}
                                    <span className="text-red-500">{formatEuro(recipe.avgCost)}</span>
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="pr-4 text-right align-top w-[40%]">
                                <div className="space-y-1 text-right">
                                  <Badge variant="secondary" className="text-sm font-semibold">
                                    {formatEuro(recipe.revenue)}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {formatPercent(recipe.revenueShare)} de vos revenus
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="px-4 py-6 text-sm text-muted-foreground">
                              Aucune recette pour ces filtres.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </Card>
            </div>
          </CardContent>
        ) : null}
      </Card>
    </div>
  )
}
