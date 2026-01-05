import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { FilePenLine, Loader2 } from "lucide-react"
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

type ReportableRecipe = {
  id: string
  name: string
  price: number
}

type FinancialInputs = {
  laborCost: string
  headcount: string
  fixedCosts: string
  variableCosts: string
  otherCosts: string
  revenueFood: string
  revenueTotal: string
}

type ReportEditDialogProps = {
  reportMonth: string
  reportMonthDate: Date | null
  initialFinancialInputs: FinancialInputs
  initialSalesByRecipe: Record<string, string>
  reportableRecipes: ReportableRecipe[]
  formatEuro: (value: number) => string
  onSubmit: (payload: {
    targetMonth: Date
    financialInputs: FinancialInputs
    salesByRecipe: Record<string, string>
  }) => Promise<{ id?: string | null } | void>
}

export default function ReportEditDialog({
  reportMonth,
  reportMonthDate,
  initialFinancialInputs,
  initialSalesByRecipe,
  reportableRecipes,
  formatEuro,
  onSubmit,
}: ReportEditDialogProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [financialInputs, setFinancialInputs] = useState<FinancialInputs>(initialFinancialInputs)
  const [salesByRecipe, setSalesByRecipe] = useState<Record<string, string>>(initialSalesByRecipe)
  const [showEditValidation, setShowEditValidation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editOpen) return
    setFinancialInputs(initialFinancialInputs)
    setSalesByRecipe(initialSalesByRecipe)
  }, [editOpen, initialFinancialInputs, initialSalesByRecipe])

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
    (key: keyof FinancialInputs) => (event: ChangeEvent<HTMLInputElement>) => {
      setFinancialInputs((prev) => ({ ...prev, [key]: event.target.value }))
    }
  const handleSalesInput = (recipeId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setSalesByRecipe((prev) => ({ ...prev, [recipeId]: event.target.value }))
  }
  const handleEditAttempt = async () => {
    if (!isEditReady) {
      setShowEditValidation(true)
      toast.error("Modification du rapport impossible.")
      return
    }
    if (!reportMonthDate) {
      toast.error("Date du rapport invalide.")
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        targetMonth: reportMonthDate,
        financialInputs,
        salesByRecipe,
      })
      toast.success(
        <>
          Le rapport du mois de <span className="font-semibold">{reportMonth}</span> a été modifié.
        </>
      )
      setEditOpen(false)
      setShowEditValidation(false)
    } catch {
      toast.error("Impossible de modifier le rapport financier.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
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
        <Button variant="outline" className="gap-2" disabled={isSubmitting}>
          <FilePenLine className="h-4 w-4" />
          Modifier le rapport
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:w-[1020px] max-w-[98vw] sm:!max-w-[1100px] max-h-[82vh] overflow-y-auto">
        <DialogHeader className="space-y-2">
          <DialogTitle>Modifier un rapport financier</DialogTitle>
          <DialogDescription>Modifiez les ventes et les données financières du rapport.</DialogDescription>
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
            disabled={!isEditReady || isSubmitting}
            aria-disabled={!isEditReady || isSubmitting}
            className={`gap-2 ${!isEditReady || isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Modifier le rapport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
