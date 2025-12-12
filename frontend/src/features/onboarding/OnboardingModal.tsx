import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EstablishmentStep } from "./steps/EstablishmentStep"

type OnboardingStep = "establishment" | null

interface OnboardingModalProps {
  step: OnboardingStep
  onDone: () => void
  userId?: string | null
  establishmentsCount?: number
}

export function OnboardingModal({ step, onDone, userId, establishmentsCount = 0 }: OnboardingModalProps) {
  const [open, setOpen] = useState(!!step)
  const [closeAlert, setCloseAlert] = useState(false)

  useEffect(() => {
    setOpen(!!step)
  }, [step])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && establishmentsCount === 0) {
      setCloseAlert(true)
      setOpen(true)
      return
    }
    setOpen(nextOpen)
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

        {closeAlert && (
          <div className="text-sm text-red-600">
            Action requise : vous devez créer au moins un établissement pour continuer.
          </div>
        )}

        {step === "establishment" && (
          <EstablishmentStep userId={userId ?? undefined} onDone={onDone} />
        )}
      </DialogContent>
    </Dialog>
  )
}
