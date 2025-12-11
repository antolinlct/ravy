import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EstablishmentStep } from "./steps/EstablishmentStep"

type OnboardingStep = "establishment" | null

interface OnboardingModalProps {
  step: OnboardingStep
  onDone: () => void
  userId?: string | null
}

export function OnboardingModal({ step, onDone, userId }: OnboardingModalProps) {
  return (
    <Dialog open={!!step} onOpenChange={() => {}}>
      <DialogContent
        data-onboarding-dialog      >
        <DialogHeader>
          <DialogTitle>Créez votre premier établissement</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour créer un établissement
          </DialogDescription>
        </DialogHeader>
        {step === "establishment" && <EstablishmentStep userId={userId ?? undefined} onDone={onDone} />}
      </DialogContent>
    </Dialog>
  )
}
