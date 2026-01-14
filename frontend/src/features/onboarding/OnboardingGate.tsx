import { useEffect, useState } from "react"
import { OnboardingModal } from "./OnboardingModal"
import { useUser } from "@/context/UserContext"
import { useUserEstablishments } from "@/context/UserEstablishmentsContext"

type OnboardingStep = "establishment" | null

export function OnboardingGate() {
  const user = useUser()
  const userEstablishments = useUserEstablishments()
  const [step, setStep] = useState<OnboardingStep>(null)
  const [establishmentsCount, setEstablishmentsCount] = useState(0)

  useEffect(() => {
    if (!user?.id) {
      setEstablishmentsCount(0)
      setStep(null)
      return
    }

    if (userEstablishments?.loading) {
      return
    }
    const count = userEstablishments?.list?.length ?? 0
    setEstablishmentsCount(count)
    setStep(count === 0 ? "establishment" : null)
  }, [user?.id, userEstablishments?.list, userEstablishments?.loading])

  if (!step) return null

  return (
    <OnboardingModal
      step={step}
      establishmentsCount={establishmentsCount}
      onDone={() => userEstablishments?.reload?.()}
    />
  )
}
