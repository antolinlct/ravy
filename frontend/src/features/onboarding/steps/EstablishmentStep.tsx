import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EstablishmentStepProps {
  onDone: () => void
  userId?: string
}

export function EstablishmentStep({ onDone, userId }: EstablishmentStepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const API_URL = import.meta.env.VITE_API_URL

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = new FormData(e.currentTarget)
    const name = form.get("name")?.toString().trim()
    const email = form.get("email")?.toString().trim()
    const phone = form.get("phone")?.toString().trim()
    const averageDailyCovers = form.get("average_daily_covers")?.toString().trim()
    const averageAnnualRevenue = form.get("average_annual_revenue")?.toString().trim()

    if (!name || !email || !phone || !averageDailyCovers || !averageAnnualRevenue) {
      setError("Merci de renseigner tous les champs.")
      return
    }

    const dailyCoversNum = Number(averageDailyCovers)
    const annualRevenueNum = Number(averageAnnualRevenue)

    if (Number.isNaN(dailyCoversNum) || Number.isNaN(annualRevenueNum)) {
      setError("Les valeurs numériques doivent être valides.")
      return
    }

    setLoading(true)

    try {
      const user = await getCurrentUser(userId)
      if (!user) {
        setError("Impossible de récupérer votre session.")
        return
      }

      const establishmentRes = await fetch(`${API_URL}/establishments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          average_daily_covers: dailyCoversNum,
          average_annual_revenue: annualRevenueNum,
        }),
      })

      if (!establishmentRes.ok) {
        const err = await establishmentRes.json().catch(() => ({}))
        setError(err?.detail || "Impossible de créer l'établissement.")
        return
      }

      const establishmentData = await establishmentRes.json()
      const establishmentId = establishmentData?.id
      if (!establishmentId) {
        setError("Identifiant d'établissement manquant.")
        return
      }

      const linkRes = await fetch(`${API_URL}/user_establishment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          establishment_id: establishmentId,
          role: "owner",
        }),
      })

      if (!linkRes.ok) {
        const err = await linkRes.json().catch(() => ({}))
        setError(err?.detail || "Impossible d'associer l'établissement.")
        return
      }

      onDone()
    } catch (err) {
      console.error("Establishment step error:", err)
      setError("Une erreur est survenue. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Nom public et coordonnées principales.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="establishment-name">Nom</Label>
              <Input id="establishment-name" name="name" placeholder="Mon restaurant" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="establishment-email">Email</Label>
              <Input id="establishment-email" name="email" type="email" placeholder="contact@exemple.fr" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="establishment-phone">Téléphone</Label>
              <Input id="establishment-phone" name="phone" type="tel" placeholder="+33 6 12 34 56 78" required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activité</CardTitle>
          <CardDescription>Volumes et projection annuelle.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="establishment-daily">Couverts moyens / jour</Label>
              <Input
                id="establishment-daily"
                name="average_daily_covers"
                type="number"
                step="1"
                placeholder="120"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="establishment-annual">CA annuel estimé (€)</Label>
              <Input
                id="establishment-annual"
                name="average_annual_revenue"
                type="number"
                step="1"
                placeholder="450000"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Création..." : "Créer l'établissement"}
        </Button>
      </div>
    </form>
  )
}

async function getCurrentUser(passedUserId?: string) {
  if (passedUserId) return { id: passedUserId }
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}
