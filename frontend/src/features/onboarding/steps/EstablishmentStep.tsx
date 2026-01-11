import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface EstablishmentStepProps {
  onDone: (establishmentId?: string) => void
}

export function EstablishmentStep({ onDone }: EstablishmentStepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    full_address: "",
    average_daily_covers: "",
    average_annual_revenue: "",
    siren: "",
  })

  const API_URL = import.meta.env.VITE_API_URL
  const LOGO_BUCKET = import.meta.env.VITE_SUPABASE_LOGO_BUCKET || "logos"
  const PLAN_FREE_CODE = "PLAN_FREE"

  const toNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const buildPeriodWindow = () => {
    const start = new Date()
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    return {
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    }
  }

  const fetchPlanFree = async () => {
    const res = await fetch(`${API_URL}/product_stripe?limit=200`)
    if (!res.ok) {
      throw new Error("Impossible de récupérer le plan gratuit.")
    }
    const data = await res.json().catch(() => [])
    if (!Array.isArray(data) || !data.length) {
      throw new Error("Plan gratuit introuvable.")
    }
    const planFree = data.find(
      (item) => item?.internal_code === PLAN_FREE_CODE
    )
    if (!planFree) {
      throw new Error("Plan gratuit introuvable.")
    }
    return planFree as {
      included_invoices?: number | string | null
      included_recipes?: number | string | null
      included_seats?: number | string | null
    }
  }

  const ensureBillingAccount = async (establishmentId: string) => {
    const payload = {
      establishment_id: establishmentId,
      free_mode: true,
      billing_cycle: "monthly",
    }

    const createRes = await fetch(`${API_URL}/billing_account/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (createRes.ok) return

    const existingRes = await fetch(
      `${API_URL}/billing_account?establishment_id=${establishmentId}&limit=1`
    )
    if (!existingRes.ok) {
      throw new Error("Impossible de créer le compte de facturation.")
    }
    const existing = await existingRes.json().catch(() => [])
    if (!Array.isArray(existing) || existing.length === 0) {
      throw new Error("Impossible de créer le compte de facturation.")
    }
  }

  const ensureUsageCounters = async (
    establishmentId: string,
    planFree: {
      included_invoices?: number | string | null
      included_recipes?: number | string | null
      included_seats?: number | string | null
    }
  ) => {
    const existingRes = await fetch(
      `${API_URL}/usage_counters?establishment_id=${establishmentId}&limit=200`
    )
    if (!existingRes.ok) {
      throw new Error("Impossible d'initialiser les quotas.")
    }
    const existing = await existingRes.json().catch(() => [])
    const existingCategories = new Set<string>()
    if (Array.isArray(existing)) {
      existing.forEach((row) => {
        if (row?.value_category) existingCategories.add(row.value_category)
      })
    }

    const { periodStart, periodEnd } = buildPeriodWindow()
    const quotas = {
      invoices: toNumber(planFree.included_invoices),
      recipe: toNumber(planFree.included_recipes),
      seat: toNumber(planFree.included_seats),
    }

    const countersToCreate = (["invoices", "recipe", "seat"] as const).filter(
      (category) => !existingCategories.has(category)
    )

    for (const category of countersToCreate) {
      const createRes = await fetch(`${API_URL}/usage_counters/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_id: establishmentId,
          value_category: category,
          period_start: periodStart,
          period_end: periodEnd,
          used_value: 0,
          limit_value: quotas[category],
        }),
      })

      if (!createRes.ok) {
        throw new Error("Impossible d'initialiser les quotas.")
      }
    }
  }

  function updateField<K extends keyof typeof formData>(key: K, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function validateStepOne() {
    const { name, email, phone, full_address } = formData
    if (!name || !email || !phone || !full_address) {
      setError("Merci de renseigner tous les champs.")
      return false
    }
    const phoneDigits = phone.replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      setError("Merci de renseigner un numéro de téléphone valide.")
      return false
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      setError("Merci de renseigner un email valide.")
      return false
    }
    return true
  }

  function validateStepTwo() {
    const { average_daily_covers, average_annual_revenue, siren } = formData
    if (!average_daily_covers || !average_annual_revenue || !siren) {
      setError("Merci de renseigner tous les champs.")
      return false
    }

    if (!/^\d{9}$/.test(siren)) {
      setError("Merci de renseigner un SIREN valide.")
      return false
    }

    const dailyCoversNum = Number(average_daily_covers)
    const annualRevenueNum = Number(average_annual_revenue)

    if (Number.isNaN(dailyCoversNum) || Number.isNaN(annualRevenueNum)) {
      setError("Les valeurs numériques doivent être valides.")
      return
    }

    return true
  }

  async function handleLogoChange(file: File | null) {
    if (!file) {
      setLogoFile(null)
      return
    }

    const dataUrl = await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })

    if (!dataUrl) {
      setError("Impossible de lire ce fichier.")
      return
    }

    setError(null)
    setLogoFile(file)
  }

  function isAllowedFile(file: File | null) {
    if (!file) return true
    const allowed = ["image/png", "image/svg+xml", "image/jpeg", "image/jpg"]
    return allowed.includes(file.type)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!validateStepOne() || !validateStepTwo()) {
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        setError("Votre session a expiré. Veuillez vous reconnecter.")
        return
      }

      const user = authData.user

      const establishmentRes = await fetch(`${API_URL}/establishments/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          full_adresse: formData.full_address,
          average_daily_covers: Number(formData.average_daily_covers),
          average_annual_revenue: Number(formData.average_annual_revenue),
          siren: formData.siren,
          logo_path: null,
          country_id: "1df9614d-c68b-4891-adfa-61e75246cd28",
          slug: formData.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "") || "etablissement",
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

      let logoPath: string | null = null

      if (logoFile) {
        const safeName = logoFile.name.replace(/\s+/g, "-")
        const path = `${establishmentId}/${Date.now()}-${safeName}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(LOGO_BUCKET)
          .upload(path, logoFile, {
            upsert: true,
            cacheControl: "3600",
            contentType: logoFile.type || "application/octet-stream",
          })

        if (uploadError) {
          console.error("Logo upload error:", uploadError)
        } else {
          logoPath = uploadData?.path ?? uploadData?.fullPath ?? path
        }
      }

      if (logoPath) {
        const updateRes = await fetch(`${API_URL}/establishments/${establishmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logo_path: logoPath }),
        })

        if (!updateRes.ok) {
          console.error("Establishment logo update failed:", updateRes.status)
        }
      }

      const planFree = await fetchPlanFree()
      await ensureBillingAccount(establishmentId)
      await ensureUsageCounters(establishmentId, planFree)

      onDone(establishmentId)
    } catch (err) {
      console.error("Establishment step error:", err)
      setError("Une erreur est survenue. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={currentStep === 1 ? "text-foreground" : "text-muted-foreground"}>
          Étape 1/2
        </span>
        <span className="text-muted-foreground">•</span>
        <span className={currentStep === 2 ? "text-foreground" : "text-muted-foreground"}>
          Étape 2/2
        </span>
      </div>

      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="establishment-name">Nom de l'établissement</Label>
              <Input
                id="establishment-name"
                placeholder="Mon restaurant"
                minLength={2}
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="establishment-phone">Téléphone professionnel</Label>
              <PhoneInput
                id="establishment-phone"
                name="establishment-phone"
                defaultCountry="FR"
                countries={["FR"]}
                placeholder="+33 6 12 34 56 78"
                value={formData.phone}
                onChange={(val) => updateField("phone", (val as string) || "")}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="establishment-email">Email professionnel</Label>
              <Input
                id="establishment-email"
                type="email"
                placeholder="contact@exemple.fr"
                inputMode="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="establishment-address">Adresse complète</Label>
              <Input
                id="establishment-address"
                placeholder="12 Rue des Fleurs, 75000 Paris"
                inputMode="text"
                minLength={5}
                value={formData.full_address}
                onChange={(e) => updateField("full_address", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => {
                setError(null)
                if (validateStepOne()) {
                  setCurrentStep(2)
                }
              }}
              className="gap-2"
            >
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="establishment-annual">CA annuel estimé</Label>
              <div className="relative">
                <Input
                  id="establishment-annual"
                  type="number"
                  inputMode="decimal"
                  placeholder="450000"
                  value={formData.average_annual_revenue}
                  onChange={(e) => updateField("average_annual_revenue", e.target.value)}
                  required
                  className="pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="establishment-daily">Couverts moyens</Label>
              <div className="relative">
                <Input
                  id="establishment-daily"
                  type="number"
                  inputMode="numeric"
                  placeholder="120"
                  value={formData.average_daily_covers}
                  onChange={(e) => updateField("average_daily_covers", e.target.value)}
                  required
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  / jour
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="establishment-siren">SIREN</Label>
            <Input
              id="establishment-siren"
              inputMode="numeric"
              placeholder="123456789"
              value={formData.siren}
              onChange={(e) => updateField("siren", e.target.value)}
              minLength={9}
              maxLength={9}
              required
            />
          </div>

        <div className="space-y-2">
          <Label htmlFor="establishment-logo">Logo carré</Label>
            <Input
              id="establishment-logo"
              type="file"
              accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (file && !isAllowedFile(file)) {
                setError("Formats acceptés : png, jpg, svg.")
                return
              }
              handleLogoChange(file)
              }}
              required={false}
              className="border-dashed h-15 text-center flex items-center justify-center file:mr-3"
            />
            <p className="text-sm text-muted-foreground">
              Formats png, jpg ou svg. Ce logo servira d'avatar (optionnel).
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <Button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                setError(null)
                if (!validateStepOne() || !validateStepTwo()) {
                  e.preventDefault()
                  return
                }
              }}
              className="gap-2"
            >
              {loading ? "Création..." : "Créer l'établissement"}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
