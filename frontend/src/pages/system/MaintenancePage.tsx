"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tagline } from "@/components/pro-blocks/landing-page/tagline"
import { Clock3 } from "lucide-react"
import { Logo } from "@/assets/branding/Logo"

export default function MaintenancePage({
  maintenanceEnd,
}: {
  maintenanceEnd?: string | null
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  // Compteur basé sur la date envoyée par le back-office
  useEffect(() => {
    if (!maintenanceEnd) return
    const target = new Date(maintenanceEnd).getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((target - now) / 1000))
      setTimeLeft(diff)
      if (diff <= 0) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [maintenanceEnd])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}h ${m
      .toString()
      .padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`
  }

  return (
    <section
      className="bg-background section-padding-y"
      aria-labelledby="maintenance-title"
    >
      <div className="container-padding-x relative z-10 container mx-auto flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
        <div className="m-auto flex max-w-xl flex-1 flex-col items-center gap-6 text-center lg:gap-8">
          {/* Logo */}
            <Logo className="h-14 w-auto mb-2" />
          {/* Texte principal */}
          <div className="section-title-gap-xl flex flex-col items-center text-center">
            <Tagline>Maintenance en cours</Tagline>

            <h1
              id="maintenance-title"
              className="heading-xl"
            >
              ravy est en cuisine...
            </h1>

            <p className="text-muted-foreground text-base lg:text-lg">
              Nous faisons quelques ajustements pour améliorer votre
              expérience. Le service sera de retour très bientôt.
            </p>
          </div>

         <div
  className="flex w-full max-w-sm items-center gap-3 rounded-xl border bg-card px-5 py-3 shadow-sm justify-center"
>
  {/* Icône */}
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
    <Clock3 className="h-5 w-5 text-muted-foreground" />
  </div>

  {/* Texte chrono */}
  <p className="text-lg font-semibold text-foreground">
    {timeLeft && timeLeft > 0
      ? formatTime(timeLeft)
      : "Encore quelques minutes"}
  </p>
</div>

          {/* Bouton */}
          <Button
            onClick={() => location.reload()}
          >
            Actualiser la page
          </Button>
        </div>
      </div>
    </section>
  )
}
