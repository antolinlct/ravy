import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { FilePlus, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type MonthOption = {
  value: string
  label: string
  monthIndex: number
  year: number
}

type ReportableRecipe = {
  id: string
  name: string
  price: number
}

type ReportCreateDialogProps = {
  monthOptions: MonthOption[]
  existingReportMonths: Set<string>
  reportableRecipes: ReportableRecipe[]
  formatEuro: (value: number) => string
  onSubmit: (payload: {
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
  }) => Promise<{ id?: string | null } | void>
}

export default function ReportCreateDialog({
  monthOptions,
  existingReportMonths,
  reportableRecipes,
  formatEuro,
  onSubmit,
}: ReportCreateDialogProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedMonthKey, setSelectedMonthKey] = useState("")
  const selectedMonth = monthOptions.find((option) => option.value === selectedMonthKey)
  const selectedMonthLabel = selectedMonth?.label ?? "ce mois"
  const [financialInputs, setFinancialInputs] = useState({
    laborCost: "",
    headcount: "",
    fixedCosts: "",
    variableCosts: "",
    otherCosts: "",
    revenueFood: "",
    revenueTotal: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const [salesByRecipe, setSalesByRecipe] = useState<Record<string, string>>({})

  const firstAvailableMonth = useMemo(
    () => monthOptions.find((option) => !existingReportMonths.has(option.value))?.value ?? "",
    [existingReportMonths, monthOptions]
  )

  useEffect(() => {
    const isSelectedAvailable =
      selectedMonthKey &&
      monthOptions.some((option) => option.value === selectedMonthKey) &&
      !existingReportMonths.has(selectedMonthKey)
    if (!isSelectedAvailable) {
      setSelectedMonthKey(firstAvailableMonth)
    }
  }, [existingReportMonths, firstAvailableMonth, monthOptions, selectedMonthKey])

  const isSelectedMonthTaken = selectedMonthKey ? existingReportMonths.has(selectedMonthKey) : false
  const hasAtLeastOneSale = useMemo(
    () => Object.values(salesByRecipe).some((value) => Number(value) >= 1),
    [salesByRecipe]
  )
  const isFinancialComplete = useMemo(
    () => Object.values(financialInputs).every((value) => value.trim() !== ""),
    [financialInputs]
  )
  const isFormReady =
    Boolean(selectedMonthKey) && !isSelectedMonthTaken && isFinancialComplete && hasAtLeastOneSale
  const showFinancialErrors = showValidation && !isFinancialComplete
  const showSalesError = showValidation && !hasAtLeastOneSale

  const handleFinancialInput =
    (key: keyof typeof financialInputs) => (event: ChangeEvent<HTMLInputElement>) => {
      setFinancialInputs((prev) => ({ ...prev, [key]: event.target.value }))
    }
  const handleSalesInput = (recipeId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setSalesByRecipe((prev) => ({ ...prev, [recipeId]: event.target.value }))
  }
  const requiredInputClass = (value: string) =>
    showFinancialErrors && !value.trim() ? "border-destructive focus-visible:ring-destructive" : ""
  const handleCreateAttempt = async () => {
    if (!isFormReady) {
      setShowValidation(true)
      toast.error("Création du rapport impossible.")
      return
    }
    if (!selectedMonth) {
      toast.error("Selection de mois invalide.")
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        targetMonth: new Date(selectedMonth.year, selectedMonth.monthIndex, 1),
        financialInputs,
        salesByRecipe,
      })
      toast.success(
        <>
          Le rapport du mois de <span className="font-semibold">{selectedMonthLabel}</span> a été créé.
        </>
      )
      setCreateOpen(false)
      setShowValidation(false)
      setSalesByRecipe({})
      setFinancialInputs({
        laborCost: "",
        headcount: "",
        fixedCosts: "",
        variableCosts: "",
        otherCosts: "",
        revenueFood: "",
        revenueTotal: "",
      })
    } catch {
      toast.error("Impossible de creer le rapport financier.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isSubmitting}>
          <FilePlus className="h-4 w-4" />
          Creer un rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>Créer un rapport financier</DialogTitle>
          <DialogDescription>
            Sélectionnez la période, puis renseignez les ventes et les données financières.
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
                        <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Sélectionner un mois" />
                          </SelectTrigger>
                          <SelectContent>
                            {monthOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                disabled={existingReportMonths.has(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Choisissez le mois de reference du rapport financier.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Card className="border-border/60">
              <CardHeader className="p-4">
                <CardTitle>Données financières</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Remplissez les champs suivants pour {selectedMonthLabel}.
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
                Indiquez le nombre de ventes par recette effectuées sur {selectedMonthLabel}.
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
          <Button variant="ghost" onClick={() => setCreateOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleCreateAttempt}
            disabled={!isFormReady || isSubmitting}
            aria-disabled={!isFormReady || isSubmitting}
            className={`gap-2 ${!isFormReady || isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Créer un rapport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
