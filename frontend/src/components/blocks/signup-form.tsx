import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Logo } from "@/assets/branding/Logo"
import { CheckCircle } from "lucide-react"


import { cn } from "@/lib/utils"
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
import { Mail } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const loginUrl = `${window.location.origin}/login`
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [phone, setPhone] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const API_URL = import.meta.env.VITE_API_URL

    const form = new FormData(e.currentTarget)

    const firstName = form.get("first_name")?.toString().trim()
    const lastName = form.get("last_name")?.toString().trim()
    const phoneSms = phone.trim()
    const email = form.get("email")?.toString().trim()
    const password = form.get("password")?.toString()
    const confirm = form.get("confirm-password")?.toString()

    if (!firstName || !lastName || !email || !phoneSms || !password || !confirm) {
      setError("Tous les champs sont obligatoires.")
      setLoading(false)
      return
    }

    const phoneDigits = phoneSms.replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      setError("Merci de renseigner un numéro de téléphone valide.")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      setLoading(false)
      return
    }

    if (password !== confirm) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    const fullName = `${firstName} ${lastName}`.trim()

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: loginUrl,
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            phone_sms: phoneSms,
          },
        },
      })

      if (signUpError) {
        const alreadyRegistered =
          signUpError.message?.toLowerCase().includes("registered") ||
          signUpError.message?.toLowerCase().includes("exists")

        setError(
          alreadyRegistered
            ? "Un compte existe déjà avec cet email."
            : "Impossible de créer ce compte. Contactez le support."
        )
        return
      }

      const user = data?.user
      const existingIdentity = user && Array.isArray(user.identities) && user.identities.length === 0

      if (!user || existingIdentity) {
        setError("Un compte existe déjà avec cet email.")
        return
      }

      const profileRes = await fetch(`${API_URL}/user_profiles/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          intern_notes: null,
          phone_sms: phoneSms || null,
        }),
      })

      if (!profileRes.ok) {
        const err = await profileRes.json().catch(() => ({}))
        setError(err?.detail || "Profile creation failed.")
        return
      }

      setEmailSent(true)
    } catch (err) {
      console.error("Signup error:", err)
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className={cn("flex flex-col gap-4 items-center", className)}>
        <Card className="max-w-md w-full">
          <CardHeader className="text-center flex flex-col items-center">
            <CheckCircle className="w-8 h-8" />
            <CardTitle className="text-2xl">Vérifiez votre adresse email</CardTitle>
            <CardDescription>
              L'e-mail de confirmation vous a été envoyé ! Cliquez sur le lien pour finaliser la création de votre compte.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
            <div className="flex items-center justify-between">
          <Logo className="h-14 w-auto mb-2" />
          </div>
          <CardTitle className="text-2xl">Créez votre compte</CardTitle>
          <CardDescription>
            Replissez ce formulaire pour créer votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>

            <FieldGroup>

              {error && (
                <div className="-text-sm text-red-600">{error}</div>
              )}

              {/* FULL NAME SEPARATED */}
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field className="grid gap-2">
                    <FieldLabel htmlFor="first_name">Prénom</FieldLabel>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      placeholder="John"
                      required
                    />
                  </Field>
                  <Field className="grid gap-2">
                    <FieldLabel htmlFor="last_name">Nom</FieldLabel>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      placeholder="Doe"
                      required
                    />
                  </Field>
                </Field>
              </Field>

              {/* PHONE */}
              <Field className="grid gap-2">
                <FieldLabel htmlFor="phone_sms">Téléphone</FieldLabel>
                <div className="relative">
                  <PhoneInput
                    id="phone_sms"
                    name="phone_sms"
                    placeholder="+33 6 12 34 56 78"
                    defaultCountry="FR"
                    countries={["FR"]}
                    inputClassName=""
                    value={phone}
                    onChange={(val) => setPhone((val as string) || "")}
                    required
                  />
                </div>
              </Field>

              {/* EMAIL */}
              <Field className="grid gap-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </Field>

              {/* PASSWORDS */}
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field className="grid gap-2">
                    <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                    <Input id="password" name="password" type="password" placeholder="********" required />
                  </Field>
                  <Field className="grid gap-2">
                    <FieldLabel htmlFor="confirm-password">
                      Confirmation
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      placeholder="********"
                      required
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Minimum 8 caractères requis.
                </FieldDescription>
              </Field>

              {/* SUBMIT */}
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer un compte"}
                </Button>
                <FieldDescription className="text-center">
                  Vous avez déjà un compte ? <a href={loginUrl}>Se connecter</a>
                </FieldDescription>
              </Field>

            </FieldGroup>

          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs">
        En cliquant, vous acceptez nos <a href="#">Terms and Conditions</a>{" "}
      </FieldDescription>
    </div>
  )
}
