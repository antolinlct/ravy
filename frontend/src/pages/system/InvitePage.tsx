import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { Logo } from "@/assets/branding/Logo"
import { cn } from "@/lib/utils"
import { getSignedLogoUrl } from "@/lib/logoStorage"
import { Building2, Mail, MapPin } from "lucide-react"

type InviteInfo = {
  establishmentId: string
  establishmentName: string
  establishmentLogo?: string | null
  establishmentAddress?: string | null
  role: string
}

type ProfileFormState = {
  firstName: string
  lastName: string
  phone: string
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  accountant: "Comptable",
  staff: "Staff",
}

export default function InvitePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [step, setStep] = useState<"confirm" | "profile" | "done">("confirm")
  const [declined, setDeclined] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileFormState>({
    firstName: "",
    lastName: "",
    phone: "",
  })

  const roleLabel = useMemo(() => {
    if (!invite?.role) return "statut sélectionné"
    return roleLabels[invite.role] ?? invite.role
  }, [invite?.role])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setLoading(true)
      setError(null)

      const url = new URL(window.location.href)
      const code = url.searchParams.get("code")
      const hash =
        typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : ""
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (sessionError && active) {
          setError("Lien d'invitation invalide ou expiré.")
          setLoading(false)
          return
        }
        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${window.location.search}`
        )
      } else if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError && active) {
          setError("Lien d'invitation invalide ou expiré.")
          setLoading(false)
          return
        }
      }

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.user && active) {
        setError("Connexion requise pour accepter l'invitation.")
        setLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError || !authData?.user) {
        if (active) {
          setError("Impossible de récupérer votre compte.")
          setLoading(false)
        }
        return
      }

      const currentUserId = authData.user.id
      setEmail(authData.user.email ?? "")
      setUserId(currentUserId)

      const API_URL = import.meta.env.VITE_API_URL
      const linkRes = await fetch(
        `${API_URL}/user_establishment?user_id=${currentUserId}&order_by=created_at&direction=desc&limit=20`
      )
      if (!linkRes.ok) {
        if (active) {
          setError("Impossible de retrouver votre invitation.")
          setLoading(false)
        }
        return
      }

      const links = await linkRes.json().catch(() => [])
      if (!Array.isArray(links) || links.length === 0) {
        if (active) {
          setError("Aucune invitation active n'a été trouvée.")
          setLoading(false)
        }
        return
      }

      const latestLink = links[0]
      const establishmentId = latestLink?.establishment_id
      if (!establishmentId) {
        if (active) {
          setError("Invitation incomplète.")
          setLoading(false)
        }
        return
      }

      const estRes = await fetch(`${API_URL}/establishments/${establishmentId}`)
      if (!estRes.ok) {
        if (active) {
          setError("Impossible de charger l'établissement.")
          setLoading(false)
        }
        return
      }
      const establishment = await estRes.json().catch(() => ({}))

      const profileRes = await fetch(`${API_URL}/user_profiles/${currentUserId}`)
      const profileData = profileRes.ok ? await profileRes.json().catch(() => null) : null

      if (!active) return

      const rawLogo =
        establishment?.logo_path ??
        establishment?.logo_url ??
        establishment?.logoUrl ??
        null
      const logoUrl = rawLogo ? await getSignedLogoUrl(rawLogo) : null

      setInvite({
        establishmentId,
        establishmentName: establishment?.name ?? "Établissement",
        establishmentLogo: logoUrl,
        establishmentAddress: establishment?.full_adresse ?? null,
        role: latestLink?.role ?? "staff",
      })
      setProfile({
        firstName: profileData?.first_name ?? "",
        lastName: profileData?.last_name ?? "",
        phone: profileData?.phone_sms ?? "",
      })
      setLoading(false)
    }

    bootstrap().catch(() => {
      if (active) {
        setError("Une erreur est survenue lors du chargement de l'invitation.")
        setLoading(false)
      }
    })

    return () => {
      active = false
    }
  }, [])

  async function handleDecline() {
    setDeclined(true)
    await supabase.auth.signOut().catch(() => {
      /* ignore signout errors */
    })
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId) return
    setSaving(true)

    const payload = {
      id: userId,
      first_name: profile.firstName || null,
      last_name: profile.lastName || null,
      phone_sms: profile.phone || null,
    }

    const API_URL = import.meta.env.VITE_API_URL
    const patchRes = await fetch(`${API_URL}/user_profiles/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!patchRes.ok) {
      const createRes = await fetch(`${API_URL}/user_profiles/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!createRes.ok) {
        setError("Impossible de finaliser votre compte.")
        setSaving(false)
        return
      }
    }

    const fullName = `${profile.firstName} ${profile.lastName}`.trim()
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName || null,
        first_name: profile.firstName || null,
        last_name: profile.lastName || null,
      },
    })
    if (authUpdateError) {
      setError("Impossible de mettre à jour votre profil.")
      setSaving(false)
      return
    }

    setSaving(false)
    setStep("done")
    navigate("/dashboard")
  }

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-2">
            <Logo className="h-12 w-auto mx-auto" />
            <CardTitle>Finalisation de l&apos;invitation</CardTitle>
            <CardDescription>Connexion en cours...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (declined) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-2">
            <Logo className="h-12 w-auto mx-auto" />
            <CardTitle>Invitation refusée</CardTitle>
            <CardDescription>
              Vous pouvez fermer cette fenêtre ou contacter l&apos;établissement si besoin.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>Retour à l&apos;accueil</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center space-y-2">
            <Logo className="h-12 w-auto mx-auto" />
            <CardTitle>Invitation indisponible</CardTitle>
            <CardDescription>{error ?? "Impossible d'afficher l'invitation."}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="flex flex-col items-center text-center">
            <Logo className="h-14 w-auto mb-2" />
            <CardTitle>Invitation à rejoindre une équipe</CardTitle>
            <CardDescription>
              Vous avez été invité à rejoindre{" "}
              <span className="font-medium text-foreground">{invite.establishmentName}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === "confirm" && (
              <>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-background">
                      {invite.establishmentLogo ? (
                        <img
                          src={invite.establishmentLogo}
                          alt={invite.establishmentName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {invite.establishmentName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {invite.establishmentAddress?.trim() ||
                            "Adresse non renseignée"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                    Vous allez rejoindre cet établissement avec le statut{" "}
                    <span className="font-medium text-foreground">{roleLabel}</span>.
                    <span className="mt-2 block">
                      Vous pourrez compléter vos informations personnelles juste après.
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button onClick={() => setStep("profile")}>
                    Accepter l&apos;invitation
                  </Button>
                  <Button variant="outline" onClick={handleDecline}>
                    Refuser
                  </Button>
                </div>
              </>
            )}

            {step === "profile" && (
              <form onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Field className="space-y-1">
                    <FieldLabel>Email</FieldLabel>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={email}
                        disabled
                        className="pl-10"
                      />
                    </div>
                    <FieldDescription>
                      Votre email d&apos;invitation ne peut pas être modifié ici.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <Field className="grid grid-cols-2 gap-4">
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor="firstName">Prénom</FieldLabel>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(event) =>
                            setProfile((prev) => ({
                              ...prev,
                              firstName: event.target.value,
                            }))
                          }
                          placeholder="Camille"
                          required
                        />
                      </Field>
                      <Field className="grid gap-2">
                        <FieldLabel htmlFor="lastName">Nom</FieldLabel>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(event) =>
                            setProfile((prev) => ({
                              ...prev,
                              lastName: event.target.value,
                            }))
                          }
                          placeholder="Dubois"
                          required
                        />
                      </Field>
                    </Field>
                  </Field>

                  <Field className="grid gap-2">
                    <FieldLabel htmlFor="phone">Téléphone</FieldLabel>
                    <PhoneInput
                      id="phone"
                      name="phone"
                      placeholder="+33 6 12 34 56 78"
                      defaultCountry="FR"
                      countries={["FR"]}
                      inputClassName=""
                      value={profile.phone}
                      onChange={(val) =>
                        setProfile((prev) => ({ ...prev, phone: (val as string) || "" }))
                      }
                      required
                    />
                  </Field>

                  <Field>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Mise à jour..." : "Finaliser et accéder au tableau de bord"}
                    </Button>
                    {error && <FieldDescription className={cn("text-destructive")}>{error}</FieldDescription>}
                  </Field>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
