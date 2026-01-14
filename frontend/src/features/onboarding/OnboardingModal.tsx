import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EstablishmentStep } from "./steps/EstablishmentStep"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2 } from "lucide-react"

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
  const [introAccepted, setIntroAccepted] = useState(false)

  useEffect(() => {
    setOpen(!!step)
    if (step) {
      setIntroAccepted(false)
    }
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

        {step === "establishment" && !introAccepted && (
          <div className="space-y-5">
            <Card>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_55%)]" />
              <CardContent className="relative p-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border bg-background">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Avant de continuer
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        Créer un établissement
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Vous allez créer un nouvel établissement dont vous deviendrez
                    le/la propriétaire, avec la gestion des accès,
                    de l&apos;abonnement et de la facturation.
                  </p>
                </div>
              </CardContent>
            </Card>
            <div className="relative overflow-hidden border border-dashed bg-muted/5">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,_rgba(15,23,42,0.04),_transparent_60%)]" />
              <div className="relative p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  L&apos;établissement a déjà un compte sur Ravy ?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Si l&apos;établissement existe déjà sur Ravy, demandez à un administrateur de
                  vous inviter plutôt que d’en créer un nouveau.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={requireAtLeastOne && establishmentsCount === 0}
                onClick={() => {
                  setOpen(false)
                  onClose?.()
                }}
              >
                Annuler
              </Button>
              <Button type="button" onClick={() => setIntroAccepted(true)}>
                Continuer
              </Button>
            </div>
          </div>
        )}

        {step === "establishment" && introAccepted && (
          <EstablishmentStep onDone={onDone} />
        )}
      </DialogContent>
    </Dialog>
  )
}
