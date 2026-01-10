import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { PlanDialogItem } from "../utils"
import { currencyFormatter, getPlanPatternStyle } from "../utils"

type BillingCycle = "monthly" | "yearly"

type PlanDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  billingCycle: BillingCycle
  onBillingCycleChange: (value: BillingCycle) => void
  planItems: PlanDialogItem[]
  checkoutLoadingId: string | null
  onStartCheckout: (planItem: PlanDialogItem, cycleOverride?: BillingCycle) => Promise<void>
}

export function PlanDialog({
  open,
  onOpenChange,
  billingCycle,
  onBillingCycleChange,
  planItems,
  checkoutLoadingId,
  onStartCheckout,
}: PlanDialogProps) {
  const [upsellPlan, setUpsellPlan] = useState<PlanDialogItem | null>(null)
  const [upsellCycle, setUpsellCycle] = useState<BillingCycle>("yearly")

  useEffect(() => {
    if (!open) {
      setUpsellPlan(null)
      setUpsellCycle("yearly")
    }
  }, [open])

  const handlePlanSelect = (planItem: PlanDialogItem) => {
    const canUpsell =
      billingCycle === "monthly" && planItem.monthlyPriceId && planItem.yearlyPriceId
    if (canUpsell) {
      setUpsellPlan(planItem)
      setUpsellCycle("yearly")
      return
    }
    onStartCheckout(planItem, billingCycle)
  }

  const handleConfirmUpsell = async () => {
    if (!upsellPlan) return
    try {
      await onStartCheckout(upsellPlan, upsellCycle)
      setUpsellPlan(null)
    } catch {
      return
    }
  }

  const upsellMonthlyAmount = upsellPlan?.monthlyAmount ?? null
  const upsellYearlyAmount = upsellPlan?.yearlyAmount ?? null
  const upsellDisplayAmount = upsellCycle === "yearly" ? upsellYearlyAmount : upsellMonthlyAmount
  const upsellDisplayLabel =
    upsellDisplayAmount !== null ? currencyFormatter.format(upsellDisplayAmount) : "--"
  const yearlyBeforeDiscount = upsellMonthlyAmount !== null ? upsellMonthlyAmount * 12 : null
  const yearlySavings =
    yearlyBeforeDiscount !== null && upsellYearlyAmount !== null
      ? yearlyBeforeDiscount - upsellYearlyAmount
      : null
  const yearlyEquivalent =
    upsellYearlyAmount !== null ? upsellYearlyAmount / 12 : null
  const yearlyBeforeLabel =
    yearlyBeforeDiscount !== null ? currencyFormatter.format(yearlyBeforeDiscount) : null
  const yearlySavingsLabel =
    yearlySavings !== null && yearlySavings > 0 ? currencyFormatter.format(yearlySavings) : null
  const yearlyEquivalentLabel =
    yearlyEquivalent !== null ? currencyFormatter.format(yearlyEquivalent) : null
  const showYearlyPromo =
    upsellCycle === "yearly" &&
    yearlyBeforeDiscount !== null &&
    upsellYearlyAmount !== null &&
    yearlyBeforeDiscount > upsellYearlyAmount
  const showAnnualBenefits =
    upsellCycle === "yearly" && Boolean(yearlyEquivalentLabel && yearlySavingsLabel)
  const showMonthlyNotice = upsellCycle === "monthly" && Boolean(yearlyEquivalentLabel)
  const hasUpsellPrice =
    upsellCycle === "yearly"
      ? Boolean(upsellPlan?.yearlyPriceId)
      : Boolean(upsellPlan?.monthlyPriceId)
  const isUpsellLoading = Boolean(upsellPlan && checkoutLoadingId === upsellPlan.id)
  const upsellPatternStyle = upsellPlan ? getPlanPatternStyle(upsellPlan.tier) : undefined

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <Button type="button">Prendre un abonnement</Button>
        </DialogTrigger>
        <DialogContent className="w-[88vw] max-w-[88vw] sm:max-w-[88vw] xl:max-w-5xl">
          <div className="space-y-6">
            <DialogHeader className="text-center">
              <DialogTitle>Choisir un abonnement</DialogTitle>
              <DialogDescription>
                Sélectionnez l’offre qui correspond à votre niveau de contrôle.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                Cycle de facturation
              </p>
              <div className="rounded-lg border bg-muted p-1">
                <ToggleGroup
                  type="single"
                  value={billingCycle}
                  onValueChange={(value) => {
                    if (value) onBillingCycleChange(value as BillingCycle)
                  }}
                >
                  <ToggleGroupItem value="monthly" className="px-5">
                    Mensuel
                  </ToggleGroupItem>
                  <ToggleGroupItem value="yearly" className="px-5">
                    Annuel
                    <Badge className="ml-2 bg-emerald-500/15 text-emerald-600 text-xs pointer-events-none">
                      -20%
                    </Badge>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {planItems.length ? (
                planItems.map((planItem) => {
                  const monthlyDisplay =
                    billingCycle === "yearly"
                      ? planItem.yearlyAmount ?? planItem.monthlyAmount
                      : planItem.monthlyAmount
                  const beforeDiscount =
                    billingCycle === "yearly" && planItem.monthlyAmount !== null
                      ? planItem.monthlyAmount * 12
                      : null
                  const priceLabel =
                    monthlyDisplay !== null
                      ? currencyFormatter.format(monthlyDisplay)
                      : "--"
                  const shouldShowBefore =
                    beforeDiscount !== null &&
                    monthlyDisplay !== null &&
                    beforeDiscount > monthlyDisplay
                  const beforeLabel = shouldShowBefore
                    ? currencyFormatter.format(beforeDiscount)
                    : null
                  const patternStyle = getPlanPatternStyle(planItem.tier)
                  const isCheckoutLoading = checkoutLoadingId === planItem.id
                  const hasPrice =
                    billingCycle === "yearly"
                      ? Boolean(planItem.yearlyPriceId ?? planItem.monthlyPriceId)
                      : Boolean(planItem.monthlyPriceId ?? planItem.yearlyPriceId)

                  return (
                    <Card
                      key={planItem.id}
                      className={`relative border bg-card ${
                        planItem.isPopular
                          ? "border-primary/40 ring-2 ring-primary/40 shadow-lg md:scale-[1.03] md:z-10"
                          : "shadow-sm"
                      }`}
                    >
                      {patternStyle ? (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 z-0"
                          style={patternStyle}
                        />
                      ) : null}
                      <CardHeader className="relative z-10 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{planItem.name}</CardTitle>
                          {planItem.isPopular ? (
                            <Badge className="bg-primary/10 text-primary pointer-events-none">
                              Populaire
                            </Badge>
                          ) : planItem.tier === "menu" ? (
                            <Badge className="bg-[var(--color-chart-4)]/15 text-[var(--color-chart-4)] pointer-events-none">
                              Consultant dédié
                            </Badge>
                          ) : null}
                        </div>
                        <CardDescription>{planItem.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="relative z-10 space-y-4">
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-semibold">{priceLabel}</span>
                          <span className="text-sm text-muted-foreground">
                            {billingCycle === "yearly" ? "par an" : "par mois"}
                          </span>
                        </div>
                        {beforeLabel ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="line-through decoration-muted-foreground/60 decoration-2 text-lg font-semibold text-muted-foreground">
                              {beforeLabel}
                            </span>
                            <Badge className="bg-emerald-500/15 text-emerald-600 pointer-events-none">
                              2 mois offerts
                            </Badge>
                          </div>
                        ) : null}
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">Inclut</p>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {planItem.includes.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/60" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          type="button"
                          className="w-full"
                          variant={planItem.isPopular ? "default" : "outline"}
                          onClick={() => handlePlanSelect(planItem)}
                          disabled={!hasPrice || isCheckoutLoading}
                        >
                          {isCheckoutLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Ouverture...
                            </>
                          ) : (
                            "Choisir cette offre"
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun plan disponible pour le moment.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(upsellPlan)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setUpsellPlan(null)
            setUpsellCycle("yearly")
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader className="text-center">
            <DialogTitle>Configurer votre abonnement</DialogTitle>
            <DialogDescription>
              L’offre annuelle est recommandée pour maximiser les économies.
            </DialogDescription>
          </DialogHeader>
          {upsellPlan ? (
            <div className="space-y-5">
              <Card
                className={`relative border bg-card ${
                  upsellPlan.isPopular
                    ? "border-primary/40 ring-2 ring-primary/40 shadow-lg"
                    : "shadow-sm"
                }`}
              >
                {upsellPatternStyle ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-0"
                    style={upsellPatternStyle}
                  />
                ) : null}
                <CardHeader className="relative z-10 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{upsellPlan.name}</CardTitle>
                    {upsellPlan.isPopular ? (
                      <Badge className="bg-primary/10 text-primary pointer-events-none">
                        Populaire
                      </Badge>
                    ) : upsellPlan.tier === "menu" ? (
                      <Badge className="bg-[var(--color-chart-4)]/15 text-[var(--color-chart-4)] pointer-events-none">
                        Consultant dédié
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-end gap-2">
                    <span className="text-3xl font-semibold">{upsellDisplayLabel}</span>
                    <span className="text-sm text-muted-foreground">
                      {upsellCycle === "yearly" ? "par an" : "par mois"}
                    </span>
                    {upsellCycle === "yearly" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 pointer-events-none">
                        2 mois offerts
                      </Badge>
                    ) : null}
                  </div>
                  {showYearlyPromo && yearlyBeforeLabel ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="line-through decoration-muted-foreground/60 decoration-2 text-lg font-semibold text-muted-foreground">
                        {yearlyBeforeLabel}
                      </span>
                      <Badge className="bg-emerald-500/15 text-emerald-600 pointer-events-none">
                        -20%
                      </Badge>
                    </div>
                  ) : null}
                  {showAnnualBenefits ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-emerald-900">
                      <p className="text-sm font-semibold">
                        Économie de {yearlySavingsLabel} par an.
                      </p>
                      <p className="text-xs text-emerald-800">
                        Revient à {yearlyEquivalentLabel} / mois.
                      </p>
                    </div>
                  ) : null}
                  {showMonthlyNotice ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-rose-900">
                      <p className="text-sm font-semibold">
                        Le mensuel revient plus cher à l'année.
                      </p>
                      <p className="text-xs text-rose-800">
                        L'annuel équivaut à {yearlyEquivalentLabel} / mois.
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-muted-foreground">Cycle de facturation</p>
                <Select
                  value={upsellCycle}
                  onValueChange={(value) => setUpsellCycle(value as BillingCycle)}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Sélectionner un cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yearly">Annuel</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button type="button" variant="ghost" onClick={() => setUpsellPlan(null)}>
                  Retour aux offres
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmUpsell}
                  disabled={!hasUpsellPrice || isUpsellLoading}
                >
                  {isUpsellLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ouverture...
                    </>
                  ) : (
                    "Valider et continuer"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
