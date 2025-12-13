import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/assets/branding/Logo"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { useNavigate } from "react-router-dom"

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="flex flex-col items-center text-center space-y-2">
          <div className="flex items-center justify-between">
            <Logo className="h-14 w-auto mb-2" />
          </div>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Définissez votre nouveau mot de passe pour accéder à votre compte
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)

              if (!password || !confirmPassword) {
                setError("Les deux champs sont requis.")
                return
              }

              if (password.length < 8) {
                setError("Le mot de passe doit contenir au moins 8 caractères.")
                return
              }

              if (password !== confirmPassword) {
                setError("Les mots de passe ne correspondent pas.")
                return
              }

              setLoading(true)

              try {
                const { error: updateError } = await supabase.auth.updateUser({
                  password,
                })

                if (updateError) {
                  throw updateError
                }

                // Invalider toutes les sessions actives par sécurité
                await supabase.auth.signOut({ scope: "global" }).catch(() => {
                  /* ignore signout errors, navigate anyway */
                })

                toast.success("Mot de passe mis à jour. Connectez-vous.")
                navigate("/login")
              } catch (err) {
                console.error("Reset password error:", err)
                setError("Impossible de mettre à jour le mot de passe.")
                toast.error("Impossible de mettre à jour le mot de passe.")
              } finally {
                setLoading(false)
              }
            }}
          >
            <div className="flex flex-col gap-6">
              {error && <div className="text-sm text-red-600">{error}</div>}
              {/* Nouveau mot de passe */}
              <div className="grid gap-2 relative">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimum 8 caractères requis.
                </p>
              </div>

              {/* Confirmation du mot de passe */}
              <div className="grid gap-2 relative">
                <Label htmlFor="confirmPassword">Confirmez le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bouton principal */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
              </Button>

              {/* Lien retour */}
              <div className="mt-4 text-center text-sm">
                <a href="/login" className="underline underline-offset-4">
                  Retour à la connexion
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
