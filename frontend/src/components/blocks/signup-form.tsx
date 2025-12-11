import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import logo from "@/assets/branding/logo_og.svg"


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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const API_URL = import.meta.env.VITE_API_URL

    const form = new FormData(e.currentTarget)

    const firstName = form.get("first_name")?.toString().trim()
    const lastName = form.get("last_name")?.toString().trim()
    const phoneSms = form.get("phone_sms")?.toString().trim()
    const email = form.get("email")?.toString().trim()
    const password = form.get("password")?.toString()
    const confirm = form.get("confirm-password")?.toString()

    if (!firstName || !lastName || !email || !password || !confirm) {
      setError("All fields are required.")
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          first_name: firstName,
          last_name: lastName,
          phone_sms: phoneSms || null,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const user = data.user
    if (!user) {
      setError("Unable to retrieve created user.")
      setLoading(false)
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
    const err = await profileRes.json()
    setError(err.detail || "Profile creation failed.")
    setLoading(false)
    return
  }


    navigate("/dashboard")
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card>
        <CardHeader className="flex flex-col items-center text-center">
            <div className="flex items-center justify-between">
          <img src={logo} alt="RAVY" className="h-14 w-auto mb-2" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>

            <FieldGroup>

              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}

              {/* FULL NAME SEPARATED */}
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field className="gap-2">
                    <FieldLabel htmlFor="first_name">First Name</FieldLabel>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      placeholder="John"
                      required
                    />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="last_name">Last Name</FieldLabel>
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
              <Field className="gap-2">
                <FieldLabel htmlFor="phone_sms">Phone</FieldLabel>
                <Input
                  id="phone_sms"
                  name="phone_sms"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </Field>

              {/* EMAIL */}
              <Field className="gap-2">
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </Field>

              {/* PASSWORDS */}
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Field className="gap-2">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" name="password" type="password" required />
                  </Field>
                  <Field className="gap-2">
                    <FieldLabel htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                    />
                  </Field>
                </Field>
                <FieldDescription>
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>

              {/* SUBMIT */}
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <a href="/login">Sign in</a>
                </FieldDescription>
              </Field>

            </FieldGroup>

          </form>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs">
        By clicking, you agree to our <a href="#">Terms and Conditions</a>{" "}
      </FieldDescription>
    </div>
  )
}
