import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Logo } from "@/assets/branding/Logo"

const resetPasswordSchema = z.object({
  email: z.string().email("Veuillez saisir une adresse email valide."),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)
  const resetCloseTimeoutRef = useRef<number | null>(null)

  const resetForm = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get("email")?.toString().trim()
    const password = form.get("password")?.toString()

    if (!email || !password) {
      setError("Email et mot de passe requis.")
      setLoading(false)
      return
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError("Identifiants incorrects ou compte inexistant.")
      setLoading(false)
      return
    }

    const userId = signInData?.user?.id
    if (!userId) {
      navigate("/dashboard")
      return
    }

    const { data: roles, error: rolesError } = await supabase
      .from("user_establishment")
      .select("role")
      .eq("user_id", userId)

    if (rolesError) {
      console.error("user_establishment fetch error:", rolesError)
      navigate("/dashboard")
      return
    }

    const isPadrino =
      roles?.some((row) => row.role === "padrino" || row.role === "is_padrino") ?? false
    navigate(isPadrino ? "/backoffice" : "/dashboard")
  }

  function handleResetDialogChange(open: boolean) {
    if (resetCloseTimeoutRef.current) {
      window.clearTimeout(resetCloseTimeoutRef.current)
      resetCloseTimeoutRef.current = null
    }
    setResetOpen(open)
    if (!open) {
      setResetError(null)
      setResetSuccess(null)
      setResetLoading(false)
      resetForm.reset()
    }
  }

  async function handleResetPassword(values: ResetPasswordFormValues) {
    setResetError(null)
    setResetSuccess(null)
    setResetLoading(true)

    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error: resetPasswordError } =
        await supabase.auth.resetPasswordForEmail(values.email, { redirectTo })

      if (resetPasswordError) {
        setResetError("Impossible d'envoyer l'email de réinitialisation.")
        toast.error("Impossible d'envoyer l'email de réinitialisation.")
        return
      }

      toast.success(
        "Email de réinitialisation envoyé. Vérifiez votre boîte mail."
      )
      setResetSuccess(
        "Email de réinitialisation envoyé. Vérifiez votre boîte mail."
      )
      resetForm.reset()
      resetCloseTimeoutRef.current = window.setTimeout(() => {
        setResetOpen(false)
        setResetSuccess(null)
        resetCloseTimeoutRef.current = null
      }, 5000)
    } catch (err) {
      console.error("Forgot password error:", err)
      setResetError("Une erreur est survenue. Veuillez réessayer.")
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-between">
            <Logo className="h-14 w-auto mb-2" />
          </div>
          <CardTitle className="text-2xl">Connectez-vous</CardTitle>
          <CardDescription>
            Au menu du jour, analyses, optimisations & marges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Dialog
                    open={resetOpen}
                    onOpenChange={handleResetDialogChange}
                  >
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md p-0">
                      <Card className="border-0 shadow-none">
                        <CardHeader>
                          <CardTitle className="text-2xl">
                            Mot de passe oublié
                          </CardTitle>
                          <CardDescription>
                            Entrez votre adresse email pour recevoir un lien de
                            réinitialisation.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {resetError && (
                            <div className="mb-2 text-sm text-red-600">
                              {resetError}
                            </div>
                          )}
                          {resetSuccess ? (
                            <div className="mb-2 text-sm text-green-600">
                              {resetSuccess}
                            </div>
                          ) : (
                            <Form {...resetForm}>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  resetForm.handleSubmit(handleResetPassword)(e)
                                }}
                                className="space-y-6"
                              >
                                <FormField
                                  control={resetForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem className="grid gap-2">
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <div className="relative">
                                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                                          <Input
                                            type="email"
                                            placeholder="johndoe@mail.com"
                                            autoComplete="email"
                                            className="pl-10"
                                            {...field}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <Button
                                  type="submit"
                                  className="w-full"
                                  disabled={resetLoading}
                                >
                                  {resetLoading
                                    ? "Envoi..."
                                    : "Envoyer le lien de réinitialisation"}
                                </Button>
                              </form>
                            </Form>
                          )}
                        </CardContent>
                      </Card>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="relative">
                  <Key className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="********"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Vous n'avez pas encore de compte ?{" "}
              <a href="/signup" className="underline underline-offset-4">
                S'inscrire
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
