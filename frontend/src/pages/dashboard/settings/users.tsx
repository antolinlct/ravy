import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useEstablishment } from "@/context/EstablishmentContext"
import { usePostHog } from "posthog-js/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type AccessRow = {
  id: string
  name: string
  phone: string
  role: string
  status: string
}

type ApiUserEstablishment = {
  id?: string | null
  user_id?: string | null
  role?: string | null
}

type ApiUserProfile = {
  first_name?: string | null
  last_name?: string | null
  phone_sms?: string | null
}

export default function UsersSupportPage() {
  const { estId } = useEstablishment()
  const posthog = usePostHog()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("staff")
  const [error, setError] = useState("")
  const [, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState("")
  const [rows, setRows] = useState<AccessRow[]>([])

  function openInvite() {
    setEmail("")
    setRole("staff")
    setError("")
    setInviteOpen(true)
  }

  async function submitInvite() {
    if (!email.trim()) {
      setError("Email requis.")
      return
    }
    if (!estId) {
      setError("Aucun établissement sélectionné.")
      return
    }
    setError("")
    setLoading(true)
    try {
      // Envoi de l'invitation par email via Supabase (template d'invite)
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/login`,
          data: {
            email_template: "auth.email.template.invite",
          },
        }
      )
      if (inviteError) {
        throw inviteError
      }

      // Création du lien user_establishment avec le rôle choisi
      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/user_establishment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishment_id: estId,
          user_id: null,
          role,
        }),
      })
      if (!res.ok) {
        throw new Error("Création du lien utilisateur/établissement échouée.")
      }

      try {
        await fetch(`${API_URL}/notifications/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "invite_sent",
            email: email.trim(),
            establishment_id: estId,
            role,
          }),
        })
      } catch {
        /* ignore notification errors */
      }

      toast.success("Invitation envoyée.")
      posthog?.capture("user_invited", {
        email: email.trim(),
        role,
        establishment_id: estId,
      })
      setInviteOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'envoyer l'invitation."
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!estId) return
    let active = true
    async function load() {
      setListLoading(true)
      setListError("")
      try {
        const API_URL = import.meta.env.VITE_API_URL
        const res = await fetch(`${API_URL}/user_establishment?establishment_id=${estId}`)
        if (!active) return
        if (!res.ok) throw new Error("Impossible de charger les utilisateurs.")
        const data = await res.json()
        if (!Array.isArray(data)) {
          setRows([])
          return
        }
        const withIds = (data || []) as ApiUserEstablishment[]
        const userIds = withIds.map((item) => item.user_id).filter(Boolean) as string[]

        const profileMap: Record<string, ApiUserProfile> = {}
        await Promise.all(
          userIds.map(async (uid) => {
            try {
              const profileRes = await fetch(`${API_URL}/user_profiles/${uid}`)
              if (profileRes.ok) {
                const profile = (await profileRes.json()) as ApiUserProfile
                profileMap[uid] = profile
              }
            } catch {
              /* ignore profile errors */
            }
          })
        )

        const mapped: AccessRow[] = withIds.map((item) => {
          const uid = item.user_id
          const profile = uid ? profileMap[uid] : undefined
          const fullName =
            profile && (profile.first_name || profile.last_name)
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
              : "—"
          const phone = profile?.phone_sms || "-"
          return {
            id: item.id || uid || crypto.randomUUID(),
            name: fullName,
            phone,
            role: item.role || "—",
            status: uid ? "Actif" : "Invitation envoyée",
          }
        })
        setRows(mapped)
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : "Erreur lors du chargement."
          setListError(message)
        }
      } finally {
        if (active) setListLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [estId])

  return (
    <div className="flex items-start justify-start bg-sidebar rounded-xl gap-4 p-4">
      <div className="w-full max-w-5xl space-y-4">
        <Card>
          <CardHeader className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="mb-1">Utilisateurs & accès</CardTitle>
              <CardDescription>
                Gérez les comptes ayant accès à cet établissement.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button type="button" onClick={openInvite}>
                    Inviter un utilisateur
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Inviter un utilisateur</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    {error && (
                      <p className="text-sm text-red-600">{error}</p>
                    )}
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Statut</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Aide statuts">
                              <Info className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-72 text-sm space-y-2">
                            <p className="font-semibold">Statuts et accès</p>
                            <p><span className="font-medium">Admin</span> : gestion complète des utilisateurs, facturation et paramètres.</p>
                            <p><span className="font-medium">Manager</span> : gestion des contenus et opérations courantes.</p>
                            <p><span className="font-medium">Staff</span> : accès limité aux données opérationnelles.</p>
                            <p className="text-muted-foreground">Padrino/Owner réservés aux super-admins ou créateurs. Non attribuables ici.</p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button type="button" onClick={submitInvite}>
                      Envoyer l'invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Aide sur les statuts">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 text-sm space-y-2">
                  <p className="font-semibold">Statuts et accès</p>
                  <p><span className="font-medium">Admin</span> : gestion complète des utilisateurs, facturation et paramètres.</p>
                  <p><span className="font-medium">Manager</span> : gestion des contenus et opérations courantes.</p>
                  <p><span className="font-medium">Staff</span> : accès limité aux données opérationnelles.</p>
                  <p className="text-muted-foreground">Padrino/Owner réservés aux super-admins ou créateurs. Non attribuables ici.</p>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : rows.length ? (
                    rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-none",
                              row.role === "admin"
                                ? "bg-blue-500/15 text-blue-700"
                                : row.role === "manager"
                                  ? "bg-amber-500/15 text-amber-700"
                                  : "bg-slate-500/15 text-slate-700"
                            )}
                          >
                            {row.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.status}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {listError || "Aucun utilisateur pour le moment."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
