import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { currencyFormatter, type ActiveAddonItem, type AddonSlot, type AvailableAddonItem } from "../utils"

type AddonSlotsSectionProps = {
  isLoading: boolean
  slots: AddonSlot[]
  addonActionLoadingId: string | null
  onAddAddon: (addon: AvailableAddonItem) => void
  onEditAddon: (addon: ActiveAddonItem) => void
  billingCycle: "monthly" | "yearly"
  periodStart?: string | null
  periodEnd?: string | null
}

export function AddonSlotsSection({
  isLoading,
  slots,
  addonActionLoadingId,
  onAddAddon,
  onEditAddon,
  billingCycle,
  periodStart,
  periodEnd,
}: AddonSlotsSectionProps) {
  const isBusy = addonActionLoadingId !== null
  const now = new Date()
  const periodStartDate = periodStart ? new Date(periodStart) : null
  const periodEndDate = periodEnd ? new Date(periodEnd) : null
  const canProrate =
    periodStartDate &&
    periodEndDate &&
    Number.isFinite(periodStartDate.getTime()) &&
    Number.isFinite(periodEndDate.getTime()) &&
    periodEndDate.getTime() > periodStartDate.getTime()
  const periodEndLabel =
    periodEndDate && Number.isFinite(periodEndDate.getTime())
      ? new Intl.DateTimeFormat("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(periodEndDate)
      : null

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Packs additionnels</p>
      <div className="grid gap-3 md:grid-cols-3">
        {isLoading ? (
          [0, 1, 2].map((index) => (
            <div
              key={`addon-slot-skeleton-${index}`}
              className="rounded-lg border p-4 space-y-3 bg-card"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))
        ) : (
          slots.map((slot) => {
            if (slot.activeAddon) {
              const addon = slot.activeAddon
              const canEdit = !isBusy && Boolean(addon.priceStripeId)
              const handleEditAddon = () => {
                if (canEdit) {
                  onEditAddon(addon)
                }
              }
              return (
                <Card
                  key={slot.category}
                  className={`flex h-full min-h-[160px] flex-col bg-muted/40 p-4 shadow-sm ${
                    canEdit
                      ? "cursor-pointer transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      : ""
                  }`}
                  role={canEdit ? "button" : undefined}
                  tabIndex={canEdit ? 0 : -1}
                  aria-disabled={!canEdit}
                  onClick={handleEditAddon}
                  onKeyDown={(event) => {
                    if (!canEdit) return
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      handleEditAddon()
                    }
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {addon.name}
                    </p>
                    <Badge className="pointer-events-none border-none bg-emerald-500/15 text-emerald-700 text-xs">
                      Actif
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{addon.detail}</p>
                  <div className="mt-auto space-y-3 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-lg font-semibold text-foreground">
                        {addon.price}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Quantité : {addon.quantity}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary/90 hover:bg-primary/10"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEditAddon(addon)
                        }}
                        disabled={isBusy || !addon.priceStripeId}
                      >
                        Modifier
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            }

            const availableAddon = slot.availableAddon
            const disabled = isBusy || !availableAddon?.priceStripeId
            const inactiveTitle = availableAddon?.name ?? slot.title
            const inactiveDetail =
              availableAddon?.detail ?? "Pack disponible pour activation."
            const inactiveOpacityClass = ""
            const fullAmount =
              billingCycle === "yearly"
                ? availableAddon?.yearlyAmount ?? null
                : availableAddon?.monthlyAmount ?? null
            const fullPriceLabel = availableAddon?.price ?? null
            const showProrated =
              Boolean(canProrate && fullAmount !== null && fullAmount > 0) &&
              Boolean(periodEndDate && periodEndDate.getTime() > now.getTime())
            const totalMs = canProrate
              ? periodEndDate!.getTime() - periodStartDate!.getTime()
              : null
            const remainingMs = canProrate
              ? Math.max(periodEndDate!.getTime() - now.getTime(), 0)
              : null
            const ratio =
              totalMs && totalMs > 0 && remainingMs !== null ? remainingMs / totalMs : null
            const proratedAmount =
              showProrated && ratio !== null && ratio < 0.98
                ? fullAmount! * ratio
                : null
            const showProratedDisplay =
              showProrated && proratedAmount !== null && proratedAmount < fullAmount!
            const proratedLabel =
              proratedAmount !== null
                ? `+${currencyFormatter.format(proratedAmount)}`
                : null

            return (
              <button
                key={slot.category}
                type="button"
                aria-label={slot.title}
                className="group w-full text-left"
                onClick={() => (availableAddon ? onAddAddon(availableAddon) : null)}
                disabled={disabled}
              >
                <Card
                  className={`h-full min-h-[160px] border border-transparent transition ${
                    disabled
                      ? "cursor-not-allowed bg-transparent text-muted-foreground"
                      : "bg-transparent text-foreground hover:border-border"
                  }`}
                >
                  <div className="flex h-full flex-col p-4">
                    <div className={`flex flex-1 flex-col gap-2 ${inactiveOpacityClass}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {inactiveTitle}
                        </p>
                        <Badge className="pointer-events-none border-none bg-muted text-muted-foreground text-xs">
                          Inactif
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{inactiveDetail}</p>
                      <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                        {showProratedDisplay && proratedLabel && fullPriceLabel ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-foreground">
                                {proratedLabel}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {fullPriceLabel}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Seulement {proratedLabel}{" "}
                              {periodEndLabel ? `jusqu'au ${periodEndLabel}` : "jusqu'à la fin de période"},{" "}
                              puis {fullPriceLabel}.
                            </p>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-foreground">
                            {availableAddon?.price ?? "--"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-3">
                      <span
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                          className:
                            "w-full justify-center text-primary hover:text-primary/90 hover:bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
                        })}
                      >
                        Activer
                      </span>
                    </div>
                  </div>
                </Card>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
