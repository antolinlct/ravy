import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import { useEstablishment } from "@/context/EstablishmentContext"
import {
  useEstablishmentData,
  useEstablishmentDataReload,
} from "@/context/EstablishmentDataContext"
import { extractLogoPath, getSignedLogoUrl } from "@/lib/logoStorage"
import { supabase } from "@/lib/supabaseClient"
import { Building, IdCard, Mail, X } from "lucide-react"

const LOGO_BUCKET = import.meta.env.VITE_SUPABASE_LOGO_BUCKET || "logos"

type EstablishmentData = {
  name?: string | null
  email?: string | null
  phone?: string | null
  phone_sms?: string | null
  full_adresse?: string | null
  address?: string | null
  siren?: string | null
  logo_path?: string | null
  logo_url?: string | null
  logoUrl?: string | null
}

export default function EstablishmentSettingsPage() {
  const { estId } = useEstablishment()
  const establishment = useEstablishmentData() as EstablishmentData | null
  const reloadEstablishmentData = useEstablishmentDataReload()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [siren, setSiren] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [baseline, setBaseline] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    siren: "",
    logoPath: "",
  })

  useEffect(() => {
    if (!establishment) return

    const rawLogo =
      establishment.logo_path ?? establishment.logoUrl ?? establishment.logo_url ?? null
    const initialLogoPath =
      extractLogoPath(rawLogo) ?? (typeof rawLogo === "string" ? rawLogo : null)

    setName(establishment.name || "")
    setEmail(establishment.email || "")
    setPhone(establishment.phone || establishment.phone_sms || "")
    setAddress(establishment.full_adresse || establishment.address || "")
    setSiren(establishment.siren || "")
    setLogoPath(initialLogoPath)
    setPreviewUrl(null)
    setBaseline({
      name: establishment.name || "",
      email: establishment.email || "",
      phone: establishment.phone || establishment.phone_sms || "",
      address: establishment.full_adresse || establishment.address || "",
      siren: establishment.siren || "",
      logoPath: initialLogoPath ?? "",
    })

    let isActive = true
    getSignedLogoUrl(rawLogo).then((url) => {
      if (isActive) {
        setPreviewUrl(url)
      }
    })

    return () => {
      isActive = false
    }
  }, [establishment])

  const hasChanges =
    name !== baseline.name ||
    email !== baseline.email ||
    phone !== baseline.phone ||
    address !== baseline.address ||
    siren !== baseline.siren ||
    Boolean(logoFile)

  function validate() {
    const next: Record<string, string> = {}

    if (!name.trim()) next.name = "Nom obligatoire."
    if (!email.trim()) {
      next.email = "Email obligatoire."
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(email.trim())) {
        next.email = "Format d'email invalide."
      }
    }

    const digits = phone.replace(/\D/g, "")
    if (!phone.trim()) {
      next.phone = "Téléphone obligatoire."
    } else if (digits.length < 10) {
      next.phone = "Numéro de téléphone invalide."
    }

    if (!address.trim()) next.address = "Adresse obligatoire."
    if (!siren.trim()) {
      next.siren = "SIREN obligatoire."
    } else if (!/^\d{9}$/.test(siren.trim())) {
      next.siren = "SIREN invalide."
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleLogoChange(file: File | null) {
    if (!file) {
      setLogoFile(null)
      const signedUrl = await getSignedLogoUrl(logoPath)
      setPreviewUrl(signedUrl)
      return
    }

    const allowed = ["image/png", "image/svg+xml", "image/jpeg", "image/jpg"]
    if (!allowed.includes(file.type)) {
      toast.error("Formats acceptés : png, jpg, svg.")
      return
    }

    setLogoFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile || !estId) return logoPath

    const safeName = logoFile.name.replace(/\s+/g, "-")
    const path = `${estId}/${Date.now()}-${safeName}`
    const { data, error } = await supabase.storage
      .from(LOGO_BUCKET)
      .upload(path, logoFile, {
        upsert: true,
        cacheControl: "3600",
        contentType: logoFile.type || "application/octet-stream",
      })

    if (error) {
      toast.error("Impossible de téléverser le logo.")
      return null
    }

    return data?.path ?? data?.fullPath ?? path
  }

  async function handleSave() {
    if (!estId) {
      toast.error("Aucun établissement actif.")
      return
    }

    if (!validate()) return

    setSaving(true)
    const API_URL = import.meta.env.VITE_API_URL
    try {
      const uploadedLogoPath = await uploadLogo()
      if (logoFile && !uploadedLogoPath) {
        setSaving(false)
        return
      }

      const payload = {
        name,
        email,
        phone,
        full_adresse: address,
        siren,
        logo_path: uploadedLogoPath ?? logoPath ?? null,
      }

      const res = await fetch(`${API_URL}/establishments/${estId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        toast.error("Impossible d'enregistrer l'établissement.")
        return
      }

      const nextLogoPath = uploadedLogoPath ?? logoPath ?? null

      setBaseline({
        name,
        email,
        phone,
        address,
        siren,
        logoPath: nextLogoPath ?? "",
      })
      setLogoPath(nextLogoPath)
      setLogoFile(null)
      const signedUrl = await getSignedLogoUrl(nextLogoPath)
      setPreviewUrl(signedUrl)
      toast.success("Établissement mis à jour.")
      await reloadEstablishmentData?.()
    } catch (err) {
      console.error("Save establishment error:", err)
      toast.error("Impossible d'enregistrer l'établissement.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-start justify-start bg-sidebar rounded-xl gap-4 p-4">
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'établissement</CardTitle>
              <CardDescription>Modifiez les informations de votre établissement.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="est-name">Nom</Label>
                  <div className="relative">
                    <Building className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="est-name"
                      name="est-name"
                      placeholder="Nom de l'établissement"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      required
                      className="pl-10"
                    />
                  </div>
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="est-siren">SIREN</Label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="est-siren"
                      name="est-siren"
                      placeholder="123456789"
                      value={siren}
                      onChange={(e) => setSiren(e.target.value)}
                      aria-invalid={Boolean(errors.siren)}
                      required
                      minLength={9}
                      maxLength={9}
                      className="pl-10"
                    />
                  </div>
                  {errors.siren && <p className="text-sm text-red-600">{errors.siren}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="est-email">Email professionnelle</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="est-email"
                      name="est-email"
                      type="email"
                      inputMode="email"
                      pattern="^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
                      placeholder="contact@exemple.fr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      required
                      className="pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="est-phone">Téléphone professionnelle</Label>
                  <PhoneInput
                    id="est-phone"
                    name="est-phone"
                    defaultCountry="FR"
                    countries={["FR"]}
                    placeholder="+33 6 12 34 56 78"
                    className="w-full"
                    value={phone}
                    onChange={(val) => setPhone((val as string) || "")}
                    inputMode="tel"
                    aria-invalid={Boolean(errors.phone)}
                    required
                  />
                  {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="est-address">Adresse du restaurant</Label>
                <Input
                  id="est-address"
                  name="est-address"
                  placeholder="12 Rue des Fleurs, 75000 Paris"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  aria-invalid={Boolean(errors.address)}
                  required
                />
                {errors.address && <p className="text-sm text-red-600">{errors.address}</p>}
              </div>

              <div className="grid gap-2">
                  <Label htmlFor="est-logo">Logo</Label>
                <div className="grid grid-cols-3 gap-4 items-stretch">
                  <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 p-2 text-center col-span-2 h-16">
                    <p className="text-xs text-muted-foreground">
                      {logoFile?.name
                        ? `Fichier sélectionné : ${logoFile.name}`
                        : "Glissez-déposez ou cliquez pour remplacer le logo."}
                    </p>
                    <Input
                      id="est-logo"
                      name="est-logo"
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    {logoFile && (
                      <button
                        type="button"
                        aria-label="Supprimer le fichier sélectionné"
                        className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => handleLogoChange(null)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-center rounded-lg border border-sidebar-border/60 bg-sidebar p-0.5 h-16 w-16">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Aperçu du logo"
                        className="h-full w-full rounded-md object-contain"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">Aucun logo</div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optionel - Formats png, jpg ou svg. Un logo carré fonctionne le mieux.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" disabled={!hasChanges || saving} onClick={handleSave}>
                Enregistrer
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
