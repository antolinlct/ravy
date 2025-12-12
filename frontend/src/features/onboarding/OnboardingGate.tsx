import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { OnboardingModal } from "./OnboardingModal"

type OnboardingStep = "establishment" | null

export function OnboardingGate() {
  const [step, setStep] = useState<OnboardingStep>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [establishmentsCount, setEstablishmentsCount] = useState(0)

  const API_URL = import.meta.env.VITE_API_URL

  async function reloadChecks() {
    const { data } = await supabase.auth.getUser()
    const user = data.user

    if (!user) {
      setStep(null)
      setUserId(null)
      return
    }

    setUserId(user.id)

    const res = await fetch(`${API_URL}/user_establishment?user_id=${user.id}`)
    if (!res.ok) {
      setStep(null)
      return
    }

    const establishments = await res.json()
    if (Array.isArray(establishments)) {
      setEstablishmentsCount(establishments.length)
    }
    if (Array.isArray(establishments) && establishments.length === 0) {
      setStep("establishment")
      return
    }

    setStep(null)
  }

  useEffect(() => {
    reloadChecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!step) return null

  return (
    <OnboardingModal
      step={step}
      userId={userId}
      establishmentsCount={establishmentsCount}
      onDone={reloadChecks}
    />
  )
}
