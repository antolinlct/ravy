import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEstablishment } from "@/context/EstablishmentContext"
import {
  useEstablishmentUsageCounters,
  useEstablishmentUsageCountersLoading,
  useEstablishmentUsageCountersReload,
} from "@/context/EstablishmentDataContext"
import { useUser } from "@/context/UserContext"
import { supabase } from "@/lib/supabaseClient"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  createStripeCheckoutSession,
  createStripePortalSession,
  fetchSubscriptionData,
  updateStripeAddon,
} from "./api"
import { AddonDialog } from "./components/AddonDialog"
import { AddonSlotsSection } from "./components/AddonSlotsSection"
import { PlanDialog } from "./components/PlanDialog"
import { SubscriptionSkeleton } from "./components/SubscriptionSkeleton"
import { UsageSection } from "./components/UsageSection"
import {
  buildAddonSlots,
  buildSubscriptionViewModel,
  currencyFormatter,
  sortPlanDialogItems,
  type ActiveAddonItem,
  type AvailableAddonItem,
  type PlanDialogItem,
} from "./utils"
import { AccessLockedCard } from "@/components/access/AccessLockedCard"
import { useAccess } from "@/components/access/access-control"

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export default function SubscriptionPage() {
  const { can } = useAccess()
  const { estId } = useEstablishment()
  const user = useUser()
  const usageCounters = useEstablishmentUsageCounters()
  const usageLoading = useEstablishmentUsageCountersLoading()
  const usageReload = useEstablishmentUsageCountersReload()
  const queryClient = useQueryClient()
  const [planDialogOpen, setPlanDialogOpen] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")
  const [addonAction, setAddonAction] = useState<{
    id: string
    action: "add" | "remove" | "set_quantity"
  } | null>(null)
  const [addonDialog, setAddonDialog] = useState<{
    addon: AvailableAddonItem | ActiveAddonItem
    mode: "add" | "update"
  } | null>(null)
  const [addonQuantity, setAddonQuantity] = useState(1)
  const [addonBillingCycle, setAddonBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  )
  const { data: subscriptionData, isLoading: isSubscriptionLoading } = useQuery({
    queryKey: ["subscription", estId],
    enabled: Boolean(estId),
    queryFn: () => fetchSubscriptionData(estId as string),
  })

  const {
    plan,
    usage,
    activeAddons,
    availableAddons,
    isFree,
    hasStripeCustomer,
    planDialogItems,
  } = useMemo(
    () => buildSubscriptionViewModel(subscriptionData, usageCounters),
    [subscriptionData, usageCounters]
  )
  const subscriptionBillingCycle = (plan.billingCycle ??
    subscriptionData?.billingAccount?.billing_cycle ??
    "monthly") as "monthly" | "yearly"
  const seatUsageCounter = usageCounters.find(
    (counter) => counter.value_category === "seat"
  )
  const seatUsage = toNumber(seatUsageCounter?.used_value)
  const seatLimit = toNumber(seatUsageCounter?.limit_value)

  const isLoading = isSubscriptionLoading || usageLoading
  const sortedPlanDialogItems = useMemo(
    () => sortPlanDialogItems(planDialogItems),
    [planDialogItems]
  )
  const addonSlots = useMemo(
    () => buildAddonSlots(activeAddons, availableAddons),
    [activeAddons, availableAddons]
  )
  const addonDialogQuantity =
    addonDialog && addonDialog.mode === "update" && "quantity" in addonDialog.addon
      ? addonDialog.addon.quantity
      : undefined
  const totalAddonAmount = useMemo(() => {
    return activeAddons.reduce((sum, addon) => {
      const unitAmount =
        addon.amount ??
        (subscriptionBillingCycle === "yearly" ? addon.yearlyAmount : addon.monthlyAmount) ??
        0
      const quantity = addon.quantity || 1
      return sum + unitAmount * quantity
    }, 0)
  }, [activeAddons, subscriptionBillingCycle])
  const totalRecurringAmount = (plan.amount ?? 0) + totalAddonAmount
  const totalCycleLabel = subscriptionBillingCycle === "yearly" ? " / an" : " / mois"

  if (!can("billing")) {
    return (
      <div className="flex items-start justify-start rounded-xl gap-4">
        <div className="w-full max-w-5xl space-y-4">
          <AccessLockedCard />
        </div>
      </div>
    )
  }

  const triggerSubscriptionRefresh = () => {
    if (!estId) return
    void queryClient.invalidateQueries({ queryKey: ["subscription", estId] })
    void queryClient.refetchQueries({ queryKey: ["subscription", estId] })
    void usageReload?.()
    ;[1200, 2600].forEach((delay) => {
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["subscription", estId] })
        void queryClient.refetchQueries({ queryKey: ["subscription", estId] })
        void usageReload?.()
      }, delay)
    })
  }

  const handleOpenPortal = async () => {
    if (!estId) {
      toast.error("Établissement introuvable.")
      return
    }
    if (!subscriptionData?.billingAccount) return
    const stripeCustomerId =
      subscriptionData.billingAccount.stripe_customer_id_live ??
      subscriptionData.billingAccount.stripe_customer_id_prod ??
      null
    if (!stripeCustomerId || portalLoading) return
    setPortalLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      const portalUrl = await createStripePortalSession({
        stripeCustomerId,
        returnUrl: window.location.href,
        establishmentId: estId,
        accessToken,
      })
      if (portalUrl) {
        const opened = window.open(portalUrl, "_blank", "noopener,noreferrer")
        if (!opened) {
          toast.message("Autorisez les popups pour ouvrir le portail.")
        }
      }
    } catch {
      toast.error("Impossible d'ouvrir le portail.")
    } finally {
      setPortalLoading(false)
    }
  }

  const handleStartCheckout = async (
    planItem: PlanDialogItem,
    cycleOverride?: "monthly" | "yearly"
  ) => {
    if (checkoutLoadingId) return
    const selectedCycle = cycleOverride ?? billingCycle
    const priceStripeId =
      selectedCycle === "yearly"
        ? planItem.yearlyPriceId ?? planItem.monthlyPriceId
        : planItem.monthlyPriceId ?? planItem.yearlyPriceId
    if (!priceStripeId) return
    setCheckoutLoadingId(planItem.id)
    try {
      const returnUrl = `${window.location.origin}/dashboard/settings/subscription`
      const checkoutUrl = await createStripeCheckoutSession({
        priceStripeId,
        successUrl: returnUrl,
        cancelUrl: returnUrl,
        stripeCustomerId:
          subscriptionData?.billingAccount?.stripe_customer_id_live ??
          subscriptionData?.billingAccount?.stripe_customer_id_prod ??
          null,
        establishmentId: estId,
        userId: user?.id ?? null,
        customerEmail: user?.email ?? null,
      })
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener")
      }
    } finally {
      setCheckoutLoadingId(null)
      setPlanDialogOpen(false)
    }
  }

  const runAddonAction = async (
    action: "add" | "remove" | "set_quantity",
    addon: AvailableAddonItem | ActiveAddonItem,
    priceStripeId: string | null,
    quantity?: number
  ) => {
    if (!estId) return false
    if (addonAction) return false
    if (!priceStripeId) {
      toast.error("Prix indisponible pour ce pack.")
      return false
    }
    const normalizedQuantity =
      typeof quantity === "number" && Number.isFinite(quantity)
        ? Math.max(1, Math.floor(quantity))
        : undefined
    if ((action === "add" || action === "set_quantity") && !normalizedQuantity) {
      toast.error("La quantité doit être au moins 1.")
      return false
    }
    setAddonAction({ id: addon.id, action })
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        throw new Error("Session expirée.")
      }
      if (action === "add") {
        await updateStripeAddon({
          action: "add",
          priceStripeId,
          establishmentId: estId,
          accessToken,
          quantity: normalizedQuantity,
          prorationBehavior: "create_prorations",
        })
        if (normalizedQuantity && normalizedQuantity > 1) {
          await updateStripeAddon({
            action: "set_quantity",
            priceStripeId,
            establishmentId: estId,
            accessToken,
            quantity: normalizedQuantity,
            prorationBehavior: "create_prorations",
          })
        }
      } else {
        await updateStripeAddon({
          action,
          priceStripeId,
          establishmentId: estId,
          accessToken,
          quantity: normalizedQuantity,
          prorationBehavior: "create_prorations",
        })
      }
      const successMessage =
        action === "add"
          ? "Achat confirmé. Le pack est actif."
          : action === "set_quantity"
            ? "Quantité mise à jour."
            : "Pack retiré."
      toast.success(successMessage)
      triggerSubscriptionRefresh()
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Action impossible."
      const isPaymentError =
        action === "add" &&
        /payment|paiement|invoice|card|carte|declin|insufficient|failed/i.test(message)
      toast.error(
        isPaymentError
          ? "Paiement refusé. Votre achat n'a pas été finalisé."
          : message
      )
      return false
    } finally {
      setAddonAction(null)
    }
  }

  const handleAddAddon = (addon: AvailableAddonItem) => {
    if (addonAction) return
    setAddonDialog({ addon, mode: "add" })
    setAddonQuantity(1)
    setAddonBillingCycle(subscriptionBillingCycle)
  }

  const handleRequestAddonQuantity = (addon: ActiveAddonItem) => {
    setAddonDialog({ addon, mode: "update" })
    setAddonQuantity(addon.quantity || 1)
    setAddonBillingCycle(subscriptionBillingCycle)
  }

  const handleConfirmAddonDialog = async () => {
    if (!addonDialog) return
    const action = addonDialog.mode === "add" ? "add" : "set_quantity"
    const quantity = addonQuantity
    const targetCycle = subscriptionBillingCycle
    const priceStripeId =
      addonDialog.mode === "add"
        ? targetCycle === "yearly"
          ? addonDialog.addon.yearlyPriceId
          : addonDialog.addon.monthlyPriceId
        : addonDialog.addon.priceStripeId
    const success = await runAddonAction(
      action,
      addonDialog.addon,
      priceStripeId,
      quantity
    )
    if (success) {
      setAddonDialog(null)
    }
  }

  const handleRemoveAddonFromDialog = async () => {
    if (!addonDialog || addonDialog.mode !== "update") return
    const success = await runAddonAction(
      "remove",
      addonDialog.addon,
      addonDialog.addon.priceStripeId
    )
    if (success) {
      setAddonDialog(null)
    }
  }

  return (
    <div className="flex items-start justify-start rounded-xl gap-4">
      <div className="w-full max-w-6xl space-y-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="mb-1">Abonnement</CardTitle>
              <CardDescription>
                Abonnement principal, packs additionnels et suivi de consommation.
              </CardDescription>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <Badge className="border-none bg-green-500/15 text-green-700">
                {plan.status}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <SubscriptionSkeleton />
            ) : (
              <>
                <Card className="border bg-muted/40">
                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Abonnement principal
                        </p>
                        <p className="text-2xl font-semibold">{plan.name}</p>
                      </div>
                      <div className="space-y-1 md:text-right">
                        <p className="text-xs text-muted-foreground">
                          {plan.renewal}
                        </p>
                        <p className="text-2xl font-semibold">{plan.price}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {hasStripeCustomer ? (
                        <>
                          <Button
                            type="button"
                            onClick={handleOpenPortal}
                            disabled={portalLoading}
                          >
                            {portalLoading ? "Ouverture..." : "Consulter mes factures"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleOpenPortal}
                            disabled={portalLoading}
                          >
                            Gérer mon abonnement
                          </Button>
                        </>
                      ) : (
                        <PlanDialog
                          open={planDialogOpen}
                          onOpenChange={setPlanDialogOpen}
                          billingCycle={billingCycle}
                          onBillingCycleChange={setBillingCycle}
                          planItems={sortedPlanDialogItems}
                          checkoutLoadingId={checkoutLoadingId}
                          onStartCheckout={handleStartCheckout}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {!isFree ? (
                  <AddonSlotsSection
                    isLoading={false}
                    slots={addonSlots}
                    addonActionLoadingId={addonAction?.id ?? null}
                    onAddAddon={handleAddAddon}
                    onEditAddon={handleRequestAddonQuantity}
                    billingCycle={subscriptionBillingCycle}
                    periodStart={plan.periodStart}
                    periodEnd={plan.periodEnd}
                  />
                ) : null}

                {activeAddons.length ? (
                  <div className="flex flex-col gap-2 rounded-lg bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Total facturé</p>
                      <p className="text-xs text-muted-foreground">
                        Abonnement principal + packs additionnels
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                      {currencyFormatter.format(totalRecurringAmount)}
                      {totalCycleLabel}
                    </p>
                  </div>
                ) : null}

                <UsageSection usage={usage} isFree={isFree} />
              </>
            )}
          </CardContent>
        </Card>

        <AddonDialog
          open={Boolean(addonDialog)}
          onOpenChange={(open) => {
            if (!open) {
              setAddonDialog(null)
              setAddonQuantity(1)
            }
          }}
          addon={addonDialog?.addon ?? null}
          mode={addonDialog?.mode ?? "add"}
          selectedCycle={addonBillingCycle}
          onCycleChange={setAddonBillingCycle}
          allowedCycle={subscriptionBillingCycle}
          quantity={addonQuantity}
          onQuantityChange={setAddonQuantity}
          onConfirm={handleConfirmAddonDialog}
          originalQuantity={addonDialogQuantity}
          seatUsage={seatUsage}
          seatLimit={seatLimit}
          onRemove={handleRemoveAddonFromDialog}
          loading={Boolean(
            addonDialog &&
              addonAction?.id === addonDialog.addon.id &&
              addonAction.action !== "remove"
          )}
          removing={Boolean(
            addonDialog &&
              addonAction?.id === addonDialog.addon.id &&
              addonAction.action === "remove"
          )}
        />
      </div>
    </div>
  )
}
