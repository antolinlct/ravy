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
import { useUserData, useUserDataReload } from "@/context/UserDataContext"
import { supabase } from "@/lib/supabaseClient"
import { Mail } from "lucide-react"
import { usePostHog } from "posthog-js/react"

export default function AccountSettingsPage() {
  const userData = useUserData()
  const reloadUserData = useUserDataReload()
  const posthog = usePostHog()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState<string>("")
  const [errors, setErrors] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }>({})
  const [resetLoading, setResetLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [savedData, setSavedData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })

  const baselineFirstName = savedData.firstName
  const baselineLastName = savedData.lastName
  const baselineEmail = savedData.email
  const baselinePhone = savedData.phone
  const emailVerified = Boolean(userData?.emailVerified)

  const hasChanges =
    firstName !== baselineFirstName ||
    lastName !== baselineLastName ||
    email !== baselineEmail ||
    phone !== baselinePhone
  const hasErrors = Object.keys(errors).length > 0

  const loginRedirectUrl = `${window.location.origin}/login`

  function validateFields() {
    const nextErrors: typeof errors = {}

    if (!firstName.trim()) {
      nextErrors.firstName = "Prénom obligatoire."
    }
    if (!lastName.trim()) {
      nextErrors.lastName = "Nom obligatoire."
    }
    if (!email.trim()) {
      nextErrors.email = "Email obligatoire."
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(email.trim())) {
        nextErrors.email = "Format d'email invalide."
      }
    }

    const digits = phone.replace(/\D/g, "")
    if (!phone.trim()) {
      nextErrors.phone = "Téléphone obligatoire."
    } else if (digits.length < 10) {
      nextErrors.phone = "Numéro de téléphone invalide."
    }

    setErrors(nextErrors)
    return nextErrors
  }

  useEffect(() => {
    validateFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstName, lastName, email, phone])

  useEffect(() => {
    if (!userData) {
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setSavedData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      })
      return
    }

    setFirstName(userData.firstName || "")
    setLastName(userData.lastName || "")
    setEmail(userData.email || "")
    setPhone(userData.phone || "")
    setSavedData({
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      phone: userData.phone || "",
    })
  }, [userData])

  async function handleSave() {
    if (!userData?.id) {
      toast.error("Session expirée. Reconnectez-vous pour enregistrer.")
      return
    }

    const validationErrors = validateFields()
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    const emailChanged = email !== savedData.email
    const fullName = [firstName, lastName].filter(Boolean).join(" ")

    setSaveLoading(true)
    try {
      const { error: authError } = await supabase.auth.updateUser(
        {
          email,
          data: {
            full_name: fullName || null,
            first_name: firstName || null,
            last_name: lastName || null,
            phone_sms: phone || null,
          },
        },
        { emailRedirectTo: loginRedirectUrl }
      )

      if (authError) {
        throw authError
      }

      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: userData.id,
          first_name: firstName || null,
          last_name: lastName || null,
          phone_sms: phone || null,
        })

      if (profileError) {
        throw profileError
      }

      setSavedData({
        firstName,
        lastName,
        email,
        phone,
      })

      await reloadUserData?.()

      toast.success(
        emailChanged
          ? "Infos enregistrées. Vérifiez votre nouveau mail."
          : "Informations mises à jour."
      )
    } catch (err) {
      console.error("Save account error:", err)
      toast.error("Impossible d'enregistrer les modifications.")
    } finally {
      setSaveLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!emailVerified || !email) return
    setResetLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: loginRedirectUrl,
      })
      if (error) {
        toast.error("Impossible d'envoyer l'email de réinitialisation.")
        return
      }
      try {
        const API_URL = import.meta.env.VITE_API_URL
        await fetch(`${API_URL}/notifications/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "password_reset",
            email,
          }),
        })
      } catch {
        /* ignore notification errors */
      }
      posthog?.capture("password_reset_requested", {
        email,
      })
      toast.success("Email de réinitialisation envoyé.")
    } catch {
      toast.error("Impossible d'envoyer l'email de réinitialisation.")
    } finally {
      setResetLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!email) return
    setVerifyLoading(true)
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: loginRedirectUrl,
        },
      })
      if (error) {
        toast.error("Impossible d'envoyer l'email de confirmation.")
        return
      }
      toast.success("Email de confirmation envoyé.")
    } catch {
      toast.error("Impossible d'envoyer l'email de confirmation.")
    } finally {
      setVerifyLoading(false)
    }
  }
  return (
    <div className="flex items-start justify-start rounded-xl gap-4">
      <div className="w-full max-w-4xl space-y-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>Mettez à jour vos informations de contact.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="first-name">Prénom</Label>
                  <Input
                    id="first-name"
                    name="first-name"
                    placeholder="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    aria-invalid={Boolean(errors.firstName)}
                    required
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="last-name">Nom</Label>
                  <Input
                    id="last-name"
                    name="last-name"
                    placeholder="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    aria-invalid={Boolean(errors.lastName)}
                    required
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vous@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      required
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <PhoneInput
                      id="phone"
                      name="phone"
                      defaultCountry="FR"
                      countries={["FR"]}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full"
                      inputClassName=""
                      value={phone}
                      onChange={(val) => setPhone((val as string) || "")}
                      required
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                disabled={!hasChanges || hasErrors || saveLoading}
                onClick={handleSave}
              >
                Enregistrer
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Réinitialiser le mot de passe</CardTitle>
              <CardDescription>
                Recevez un email pour réinitialiser votre mot de passe.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={!emailVerified || !email || resetLoading}
                onClick={handleResetPassword}
              >
                Envoyer l'email de réinitialisation
              </Button>
              {!emailVerified && (
                <p className="text-sm text-red-600">
                  Vérifiez votre email avant de réinitialiser le mot de passe.
                </p>
              )}
              {!emailVerified && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={!email || verifyLoading}
                >
                  Renvoyer l'email de confirmation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
