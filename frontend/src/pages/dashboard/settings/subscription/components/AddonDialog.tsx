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
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import type { ActiveAddonItem, AvailableAddonItem } from "../utils"
import { currencyFormatter } from "../utils"

type BillingCycle = "monthly" | "yearly"
type AddonDialogMode = "add" | "update"
type AddonDialogItem = ActiveAddonItem | AvailableAddonItem

type AddonDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon: AddonDialogItem | null
  mode: AddonDialogMode
  selectedCycle: BillingCycle
  onCycleChange: (value: BillingCycle) => void
  allowedCycle?: BillingCycle | null
  quantity: number
  onQuantityChange: (value: number) => void
  onConfirm: () => void
  originalQuantity?: number
  seatUsage?: number | null
  seatLimit?: number | null
  onRemove?: () => void
  loading?: boolean
  removing?: boolean
}

export function AddonDialog({
  open,
  onOpenChange,
  addon,
  mode,
  selectedCycle,
  allowedCycle,
  quantity,
  onQuantityChange,
  onConfirm,
  originalQuantity,
  seatUsage,
  seatLimit,
  onRemove,
  loading,
  removing,
}: AddonDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false)
  const effectiveCycle = allowedCycle ?? selectedCycle
  const monthlyAmount = addon?.monthlyAmount ?? null
  const yearlyAmount = addon?.yearlyAmount ?? null
  const displayAmount = effectiveCycle === "yearly" ? yearlyAmount : monthlyAmount
  const displayLabel =
    displayAmount !== null ? `+${currencyFormatter.format(displayAmount)}` : "--"
  const cycleLabel = effectiveCycle === "yearly" ? "an" : "mois"
  const totalAmount = displayAmount !== null ? displayAmount * quantity : null
  const totalChargeLabel =
    totalAmount !== null ? `+${currencyFormatter.format(totalAmount)} / ${cycleLabel}` : "--"
  const isActionable = Boolean(addon?.priceStripeId)
  const showRemove = mode === "update" && Boolean(onRemove)
  const isBusy = Boolean(loading || removing)
  const baseQuantity =
    typeof originalQuantity === "number" && Number.isFinite(originalQuantity)
      ? originalQuantity
      : quantity
  const quantityDelta = quantity - baseQuantity
  const isQuantityUpdated = mode === "update" && quantityDelta !== 0
  const updateLabel = isQuantityUpdated ? "Mettre à jour la quantité" : "Mettre à jour"
  const addonValue =
    typeof addon?.addonValue === "number" && Number.isFinite(addon.addonValue)
      ? addon.addonValue
      : null
  const seatUsageValue =
    typeof seatUsage === "number" && Number.isFinite(seatUsage) ? seatUsage : null
  const seatLimitValue =
    typeof seatLimit === "number" && Number.isFinite(seatLimit) ? seatLimit : null
  const isSeatAddon = addon?.addonCategory === "seat"
  const MAX_PACKS = 5
  const baseSeats =
    isSeatAddon && seatLimitValue !== null && addonValue !== null
      ? seatLimitValue - addonValue * baseQuantity
      : null
  const requiredQuantity =
    isSeatAddon && seatUsageValue !== null && addonValue !== null
      ? Math.ceil(Math.max(0, seatUsageValue - (baseSeats ?? 0)) / addonValue)
      : null
  const minSeatQuantity =
    requiredQuantity !== null ? Math.max(1, requiredQuantity) : 1
  const isBelowMinSeatQuantity =
    isSeatAddon && requiredQuantity !== null && quantity < minSeatQuantity
  const exceedsMaxSeatRequirement = isSeatAddon && minSeatQuantity > MAX_PACKS
  const seatUsageLabel =
    seatUsageValue !== null
      ? new Intl.NumberFormat("fr-FR").format(seatUsageValue)
      : null
  const isRemoveBlocked = isSeatAddon && requiredQuantity !== null && requiredQuantity > 0

  const handleQuantityChange = (nextValue: number) => {
    if (!Number.isFinite(nextValue)) return
    const floorValue = Math.floor(nextValue)
    const minValue = isSeatAddon && requiredQuantity !== null ? minSeatQuantity : 1
    const maxValue = MAX_PACKS
    onQuantityChange(Math.min(Math.max(minValue, floorValue), maxValue))
  }
  const handleQuantityAdjust = (delta: number) => {
    handleQuantityChange(quantity + delta)
  }
  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmOpen(false)
    }
    onOpenChange(nextOpen)
  }
  const handlePrimaryAction = () => {
    if (mode === "add") {
      setConfirmOpen(true)
      return
    }
    if (isQuantityUpdated) {
      setConfirmOpen(true)
      return
    }
    onConfirm()
  }
  const handleRemoveAction = () => {
    setRemoveConfirmOpen(true)
  }
  const handleConfirmAdd = () => {
    setConfirmOpen(false)
    onConfirm()
  }
  const handleConfirmRemove = () => {
    setRemoveConfirmOpen(false)
    onRemove?.()
  }

  useEffect(() => {
    setConfirmOpen(false)
    setRemoveConfirmOpen(false)
  }, [addon, mode])

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle>
            {mode === "add" ? "Activer un pack" : "Modifier un pack"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Ce pack s'ajoute à votre abonnement principal."
              : "La quantité du pack sera mise à jour immédiatement."}
          </DialogDescription>
        </DialogHeader>
        {addon ? (
          <div className="space-y-5">
            <Card className="border bg-muted/20 shadow-sm">
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-foreground">{addon.name}</p>
                    <p className="text-sm text-muted-foreground">{addon.detail}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-semibold text-foreground">
                      {displayLabel}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {effectiveCycle === "yearly" ? "par an" : "par mois"}
                    </p>
                  </div>
                </div>
                {!isActionable ? (
                  <p className="text-sm text-rose-600">
                    Tarification indisponible pour le cycle actuel.
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-3 text-right">
              <p className="text-sm font-medium text-muted-foreground">
                Quantité souhaitée
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityAdjust(-1)}
                  disabled={
                    isBusy ||
                    (isSeatAddon && requiredQuantity !== null
                      ? quantity <= minSeatQuantity
                      : quantity <= 1)
                  }
                >
                  -
                </Button>
                <div className="min-w-[48px] text-center text-sm font-semibold">
                  {quantity}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityAdjust(1)}
                  disabled={isBusy || quantity >= MAX_PACKS}
                >
                  +
                </Button>
              </div>
            </div>
            {isSeatAddon && (isBelowMinSeatQuantity || isRemoveBlocked) ? (
              <p className="text-sm text-destructive text-right">
                {seatUsageLabel
                  ? `Vous avez ${seatUsageLabel} utilisateurs actifs. Supprimez un utilisateur avant de réduire la quantité.`
                  : "Supprimez un utilisateur avant de réduire la quantité."}
              </p>
            ) : null}
            {exceedsMaxSeatRequirement ? (
              <p className="text-sm text-destructive text-right">
                La limite est fixée à {MAX_PACKS} packs. Réduisez vos utilisateurs avant
                d&apos;augmenter la quantité.
              </p>
            ) : null}
            {!exceedsMaxSeatRequirement && quantity >= MAX_PACKS ? (
              <p className="text-sm text-muted-foreground text-right">
                Limité à {MAX_PACKS} packs. Contactez le support pour aller plus loin.
              </p>
            ) : null}

            <div
              className={`flex flex-col gap-2 sm:flex-row ${
                showRemove ? "sm:items-center sm:justify-between" : "sm:justify-end"
              }`}
            >
              {showRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  onClick={handleRemoveAction}
                  disabled={isBusy || isRemoveBlocked}
                >
                  {removing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer le pack"
                  )}
                </Button>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isBusy}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={
                    isBusy || !isActionable || isBelowMinSeatQuantity || exceedsMaxSeatRequirement
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {mode === "add"
                        ? "Ajout..."
                        : isQuantityUpdated
                          ? "Mise à jour..."
                          : "Mise à jour..."}
                    </>
                  ) : mode === "add" ? (
                    "Ajouter le pack"
                  ) : (
                    updateLabel
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mode === "add"
                ? "Confirmer l’activation du pack"
                : "Confirmer la mise à jour"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {mode === "add" ? (
                <>
                  {addon
                    ? `Vous êtes sur le point d’activer "${addon.name}". `
                    : "Vous êtes sur le point d’activer ce pack. "}
                  {totalAmount !== null
                    ? `Votre facture augmentera de ${totalChargeLabel}. `
                    : "Le montant exact sera confirmé à la validation. "}
                  Le prélèvement se fera à chaque renouvellement, et vous pourrez annuler à tout moment.
                </>
              ) : (
                <>
                  {addon
                    ? `Vous modifiez la quantité de "${addon.name}". `
                    : "Vous modifiez la quantité de ce pack. "}
                  {quantityDelta > 0
                    ? "Votre facture augmentera en conséquence."
                    : quantityDelta < 0
                      ? "Votre facture sera ajustée à la baisse."
                      : "Aucun changement de quantité ne sera appliqué."}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAdd} disabled={isBusy || !isActionable}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirmation...
                </>
              ) : (
                "Confirmer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce pack ?</AlertDialogTitle>
            <AlertDialogDescription>
              {addon
                ? `Vous êtes sur le point de supprimer "${addon.name}". `
                : "Vous êtes sur le point de supprimer ce pack. "}
              L’accès supplémentaire sera retiré immédiatement. Vous pourrez le réactiver à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBusy}
            >
              {removing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
