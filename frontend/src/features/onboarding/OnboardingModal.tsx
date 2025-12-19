import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EstablishmentStep } from "./steps/EstablishmentStep"

type OnboardingStep = "establishment" | null

interface OnboardingModalProps {
  step: OnboardingStep
  onDone: (establishmentId?: string) => void
  establishmentsCount?: number
  requireAtLeastOne?: boolean
  onClose?: () => void
}

export function OnboardingModal({
  step,
  onDone,
  establishmentsCount = 0,
  requireAtLeastOne = true,
  onClose,
}: OnboardingModalProps) {
  const [open, setOpen] = useState(!!step)
  const [closeAlert, setCloseAlert] = useState(false)

  useEffect(() => {
    setOpen(!!step)
  }, [step])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && requireAtLeastOne && establishmentsCount === 0) {
      setCloseAlert(true)
      setOpen(true)
      return
    }
    setOpen(nextOpen)
    if (!nextOpen) {
      onClose?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-onboarding-dialog>
        <DialogHeader>
          <DialogTitle>Ajoutez un établissement</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer un établissement
          </DialogDescription>
        </DialogHeader>

        {requireAtLeastOne && closeAlert && (
          <div className="text-sm text-red-600">
            Action requise : vous devez créer au moins un établissement pour continuer.
          </div>
        )}

        {step === "establishment" && (
          <EstablishmentStep onDone={onDone} />
        )}
      </DialogContent>
    </Dialog>
  )
}
