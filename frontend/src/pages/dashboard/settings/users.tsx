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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { Info, Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useEstablishment } from "@/context/EstablishmentContext"
import {
  useEstablishmentUsageCounters,
  useEstablishmentUsageCountersReload,
} from "@/context/EstablishmentDataContext"
import { usePostHog } from "posthog-js/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AccessLockedCard } from "@/components/access/AccessLockedCard"
import { useAccess } from "@/components/access/access-control"

type AccessRow = {
  id: string
  userId?: string | null
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
  const { can } = useAccess()
  const { estId } = useEstablishment()
  const usageCounters = useEstablishmentUsageCounters()
  const reloadUsageCounters = useEstablishmentUsageCountersReload()
  const posthog = usePostHog()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [confirmInviteOpen, setConfirmInviteOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("staff")
  const [error, setError] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState("")
  const [rows, setRows] = useState<AccessRow[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<AccessRow | null>(null)
  const [editRole, setEditRole] = useState("staff")
  const [editLoading, setEditLoading] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  const toNumber = (value: unknown) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const roleDescriptions: Record<string, string> = {
    admin:
      "Accès complet à tout le logiciel : facturation, gestion des accès, paramètres et création d’établissements. Idéal pour le responsable principal ou un co‑gérant.",
    manager:
      "Accès à toutes les fonctions opérationnelles (recettes, factures, analyses), mais sans facturation, gestion des accès ni création d’établissements.",
    accountant:
      "Accès aux factures et aux performances financières pour le suivi comptable, sans modification des paramètres ni gestion des utilisateurs.",
    staff:
      "Accès aux recettes, aux factures et aux analyses recettes/produits pour le suivi des coûts, sans accès aux réglages sensibles.",
  }
  const roleLabels: Record<string, string> = {
    owner: "Propriétaire",
    admin: "Admin",
    manager: "Manager",
    accountant: "Comptable",
    staff: "Staff",
  }

  const roleBadgeStyles: Record<string, string> = {
    owner: "bg-sky-500/15 text-sky-700 hover:bg-sky-500/15",
    admin: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/15",
    manager: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/15",
    accountant: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15",
    staff: "bg-slate-500/15 text-slate-700 hover:bg-slate-500/15",
  }

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim())

  function openInvite() {
    setEmail("")
    setRole("staff")
    setError("")
    setInviteOpen(true)
  }

  function openInviteConfirm() {
    if (!email.trim()) {
      setError("Email requis.")
      return
    }
    setError("")
    setConfirmInviteOpen(true)
  }

  async function submitInvite() {
    setConfirmInviteOpen(false)
    if (!email.trim()) {
      setError("Email requis.")
      return
    }
    if (!emailValid) {
      setError("Merci de renseigner un email valide.")
      return
    }
    if (!estId) {
      setError("Aucun établissement sélectionné.")
      return
    }
    setError("")
    setInviteLoading(true)
    try {
      // Envoi de l'invitation via le backend (clé service role)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error("Utilisateur non authentifié.")
      }

      const API_URL = import.meta.env.VITE_API_URL
      const inviteRes = await fetch(`${API_URL}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          establishment_id: estId,
          role,
          redirect_to: `${window.location.origin}/invite/accept`,
        }),
      })
      if (!inviteRes.ok) {
        const err = await inviteRes.json().catch(() => ({}))
        if (inviteRes.status === 409 && err?.detail === "user_already_has_access") {
          throw new Error("Cet utilisateur a déjà accès à cet établissement.")
        }
        throw new Error(err?.detail || "Impossible d'envoyer l'invitation.")
      }

      toast.success("Invitation envoyée.")
      posthog?.capture("user_invited", {
        email: email.trim(),
        role,
        establishment_id: estId,
      })
      await reloadUsageCounters?.()
      await loadUsers()
      setInviteOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Impossible d'envoyer l'invitation."
      setError(message)
      toast.error(message)
    } finally {
      setInviteLoading(false)
    }
  }

  const loadUsers = useCallback(async () => {
    if (!estId) return
    setListLoading(true)
    setListError("")
    try {
      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/user_establishment?establishment_id=${estId}`)
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

        const mapped: AccessRow[] = withIds
          .filter((item) => item.role !== "padrino")
          .map((item) => {
            const uid = item.user_id
          const profile = uid ? profileMap[uid] : undefined
          const fullName =
            profile && (profile.first_name || profile.last_name)
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
              : "—"
          const phone = profile?.phone_sms || "-"
            return {
              id: item.id || uid || crypto.randomUUID(),
              userId: uid ?? null,
              name: fullName,
              phone,
              role: item.role || "—",
              status: uid ? "Actif" : "Invitation envoyée",
            }
          })
        setRows(mapped)
        const current = withIds.find((item) => item.user_id === currentUserId)
        setCurrentUserRole(current?.role ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement."
      setListError(message)
    } finally {
      setListLoading(false)
    }
  }, [estId, currentUserId])

  useEffect(() => {
    loadUsers().catch(() => {
      /* ignore load errors */
    })
  }, [loadUsers])

  useEffect(() => {
    let active = true
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return
        setCurrentUserId(data.user?.id ?? null)
      })
      .catch(() => {
        if (!active) return
        setCurrentUserId(null)
      })
    return () => {
      active = false
    }
  }, [])

  function openEditDialog(row: AccessRow) {
    if (currentUserId && row.userId === currentUserId) {
      toast.message("Vous ne pouvez pas modifier votre propre statut.")
      return
    }
    if (currentUserRole === "admin" && row.role === "owner") {
      toast.message("Vous ne pouvez pas modifier le statut d'un owner.")
      return
    }
    setSelectedRow(row)
    setEditRole(roleLabels[row.role] ? row.role : "staff")
    setEditOpen(true)
  }

  async function handleUpdateRole() {
    if (!selectedRow?.userId || !estId) {
      toast.error("Impossible de modifier ce profil.")
      return
    }
    setEditLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error("Utilisateur non authentifié.")
      }

      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/invite/access`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedRow.userId,
          establishment_id: estId,
          role: editRole,
        }),
      })
      if (!res.ok) {
        throw new Error("Impossible de mettre à jour le statut.")
      }
      toast.success("Statut mis à jour.")
      setEditOpen(false)
      setSelectedRow(null)
      setEditRole("staff")
      await loadUsers()
      await reloadUsageCounters?.()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible de mettre à jour le statut."
      toast.error(message)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDeleteAccess() {
    if (!selectedRow?.userId || !estId) {
      toast.error("Impossible de supprimer cet accès.")
      return
    }
    setEditLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error("Utilisateur non authentifié.")
      }

      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/invite/access`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: selectedRow.userId,
          establishment_id: estId,
        }),
      })
      if (!res.ok) {
        throw new Error("Suppression impossible.")
      }
      toast.success("Accès supprimé.")
      setConfirmDeleteOpen(false)
      setEditOpen(false)
      setSelectedRow(null)
      await loadUsers()
      await reloadUsageCounters?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Suppression impossible."
      toast.error(message)
    } finally {
      setEditLoading(false)
    }
  }

  const seatCounter = usageCounters.find(
    (item) => item.value_category === "seat"
  )
  const seatLimit = toNumber(seatCounter?.limit_value)
  const seatUsage = Math.max(
    toNumber(seatCounter?.used_value) ?? 0,
    rows.filter((row) => row.role !== "padrino").length
  )
  const remainingInvites =
    seatLimit === null ? null : Math.max(0, seatLimit - seatUsage)
  const inviteBlocked = remainingInvites !== null && remainingInvites <= 0
  const inviteLabel =
    remainingInvites === null
      ? "Invitations illimitées"
      : remainingInvites === 0
        ? "Aucune invitation restante"
        : `${remainingInvites} invitation${remainingInvites > 1 ? "s" : ""} restante${remainingInvites > 1 ? "s" : ""}`

  if (!can("access")) {
    return (
      <div className="flex items-start justify-start rounded-xl gap-4">
        <div className="w-full max-w-5xl space-y-4">
          <AccessLockedCard />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-start rounded-xl gap-4">
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
              <span
                className={cn(
                  "text-xs font-medium",
                  inviteBlocked ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {inviteLabel}
              </span>
              <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogTrigger asChild>
                  <Button type="button" onClick={openInvite} disabled={inviteBlocked}>
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
                    {inviteBlocked ? (
                      <p className="text-sm text-destructive">
                        Vous avez atteint la limite d&apos;invitation pour cet établissement.
                      </p>
                    ) : null}
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="email@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {email && !emailValid ? (
                        <p className="text-xs text-destructive">
                          Merci de renseigner un email valide.
                        </p>
                      ) : null}
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
                          <PopoverContent align="end" className="w-72 text-sm space-y-3">
                            <p className="font-semibold">Statuts et accès</p>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">Admin</p>
                              <p className="text-xs text-muted-foreground">
                                Accès complet au logiciel, y compris la facturation et la
                                gestion des accès.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">Manager</p>
                              <p className="text-xs text-muted-foreground">
                                Accès opérationnel complet, sans facturation ni gestion des
                                accès.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">Comptable</p>
                              <p className="text-xs text-muted-foreground">
                                Accès aux factures et aux performances financières de
                                l&apos;établissement.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium text-foreground">Staff</p>
                              <p className="text-xs text-muted-foreground">
                                Accès aux recettes et aux factures ainsi qu&apos;aux analyses
                                recettes/produits.
                              </p>
                            </div>
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
                          <SelectItem value="accountant">Comptable</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {roleDescriptions[role] ??
                          "Sélectionnez un statut pour voir les droits associés."}
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <AlertDialog
                      open={confirmInviteOpen}
                      onOpenChange={setConfirmInviteOpen}
                    >
                      <Button
                        type="button"
                        onClick={openInviteConfirm}
                        disabled={inviteBlocked || inviteLoading || !emailValid}
                      >
                        {inviteLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Envoi en cours...
                          </span>
                        ) : (
                          "Envoyer l'invitation"
                        )}
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer l&apos;invitation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Souhaitez-vous vraiment inviter{" "}
                            <span className="font-medium text-foreground">
                              {email.trim() || "cet utilisateur"}
                            </span>{" "}
                            à rejoindre votre établissement avec le statut{" "}
                            <span className="font-medium text-foreground">
                              {roleLabels[role] ?? "sélectionné"}
                            </span>
                            ?
                            <br />
                            <span className="mt-2 block text-muted-foreground">
                              {roleDescriptions[role] ??
                                "Sélectionnez un statut pour voir les droits associés."}
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={submitInvite}>
                            Confirmer l&apos;invitation
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Aide sur les statuts">
                    <Info className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 text-sm space-y-3">
                  <p className="font-semibold">Statuts et accès</p>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Admin</p>
                    <p className="text-xs text-muted-foreground">
                      Accès complet au logiciel, y compris la facturation et la gestion des
                      accès.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Manager</p>
                    <p className="text-xs text-muted-foreground">
                      Accès opérationnel complet, sans facturation ni gestion des accès.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Comptable</p>
                    <p className="text-xs text-muted-foreground">
                      Accès aux factures et aux performances financières de
                      l&apos;établissement.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Staff</p>
                    <p className="text-xs text-muted-foreground">
                      Accès aux recettes et aux factures ainsi qu&apos;aux analyses
                      recettes/produits.
                    </p>
                  </div>
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
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => openEditDialog(row)}
                      >
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-none shadow-none hover:shadow-none transition-none",
                              roleBadgeStyles[row.role] ?? "bg-slate-500/15 text-slate-700"
                            )}
                          >
                            {roleLabels[row.role] ?? row.role}
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
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gérer cet utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium text-foreground">
                {selectedRow?.name || "Utilisateur"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedRow?.phone || "Téléphone non renseigné"}
              </p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="accountant">Comptable</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleDescriptions[editRole] ??
                  "Sélectionnez un statut pour voir les droits associés."}
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button">
                  Retirer l&apos;accès
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Retirer l&apos;accès à cet établissement ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Le compte reste actif, mais cet utilisateur n&apos;aura plus accès à cet établissement.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccess}>
                    Confirmer le retrait
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleUpdateRole} disabled={editLoading}>
              {editLoading ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
