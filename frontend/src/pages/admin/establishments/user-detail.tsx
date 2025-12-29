import { useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
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

import type { MercurialeLevel, UserAccount, UserEstablishmentRow } from "./types"

type UserDetailViewProps = {
  user: UserAccount
  accessLevel: MercurialeLevel | null
  establishments: UserEstablishmentRow[]
  onBack: () => void
  onUpdateAccess: (level: MercurialeLevel) => void
}

const levelLabels: Record<MercurialeLevel, string> = {
  STANDARD: "Standard",
  PLUS: "Plus",
  PREMIUM: "Premium",
}

const levelBadgeClass: Record<MercurialeLevel, string> = {
  STANDARD: "border-sky-500/40 text-sky-500",
  PLUS: "border-amber-500/40 text-amber-500",
  PREMIUM: "border-emerald-500/40 text-emerald-500",
}

const roleLabels: Record<string, string> = {
  padrino: "Padrino",
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "--"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function UserDetailView({
  user,
  accessLevel,
  establishments,
  onBack,
  onUpdateAccess,
}: UserDetailViewProps) {
  const fallbackLevel: MercurialeLevel = accessLevel ?? "STANDARD"
  const [draftLevel, setDraftLevel] = useState<MercurialeLevel>(fallbackLevel)

  useEffect(() => {
    setDraftLevel(fallbackLevel)
  }, [fallbackLevel])

  const fullName = useMemo(() => {
    const first = user.firstName?.trim()
    const last = user.lastName?.trim()
    if (first || last) {
      return [first, last].filter(Boolean).join(" ")
    }
    return user.email
  }, [user.email, user.firstName, user.lastName])

  const hasChanges = draftLevel !== fallbackLevel

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-semibold">{fullName}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        {user.superAdmin ? (
          <Badge variant="secondary">Super admin</Badge>
        ) : (
          <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">
            Utilisateur
          </Badge>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profil utilisateur</CardTitle>
            <CardDescription>Informations issues de user_profiles et users.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Prenom</Label>
              <p className="text-sm text-muted-foreground">{user.firstName ?? "--"}</p>
            </div>
            <div className="space-y-1">
              <Label>Nom</Label>
              <p className="text-sm text-muted-foreground">{user.lastName ?? "--"}</p>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="space-y-1">
              <Label>Telephone</Label>
              <p className="text-sm text-muted-foreground">{user.phone ?? "--"}</p>
            </div>
            <div className="space-y-1">
              <Label>Telephone SMS</Label>
              <p className="text-sm text-muted-foreground">{user.phoneSms ?? "--"}</p>
            </div>
            <div className="space-y-1">
              <Label>Derniere connexion</Label>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(user.lastLogin)}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Cree le</Label>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(user.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Mis a jour</Label>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(user.updatedAt)}
              </p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Notes internes</Label>
              <p className="text-sm text-muted-foreground">
                {user.internNotes ?? "--"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acces mercuriale</CardTitle>
            <CardDescription>Modifiez le niveau d acces associe a ce compte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(levelLabels) as MercurialeLevel[]).map((level) => (
                <Badge
                  key={level}
                  variant="outline"
                  className={`${levelBadgeClass[level]} ${
                    level === fallbackLevel ? "bg-background" : "opacity-60"
                  }`}
                >
                  {levelLabels[level]}
                </Badge>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label>Niveau attribue</Label>
                <Select
                  value={draftLevel}
                  onValueChange={(value) => setDraftLevel(value as MercurialeLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(levelLabels) as MercurialeLevel[]).map((level) => (
                      <SelectItem key={level} value={level}>
                        {levelLabels[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDraftLevel(fallbackLevel)}
                  disabled={!hasChanges}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={() => onUpdateAccess(draftLevel)}
                  disabled={!hasChanges}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Etablissements relies</CardTitle>
          <CardDescription>
            Roles et parametres SMS des etablissements associes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etablissement</TableHead>
                <TableHead className="w-32">Role</TableHead>
                <TableHead className="w-28">SMS</TableHead>
                <TableHead className="w-36">Type SMS</TableHead>
                <TableHead className="w-28">Trigger</TableHead>
                <TableHead className="w-40">Siren</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {establishments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleLabels[item.role] ?? item.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.activeSms ? "default" : "secondary"}>
                      {item.activeSms ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.typeSms}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.smsVariationTrigger ?? "--"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.siren ?? "--"}
                  </TableCell>
                </TableRow>
              ))}
              {establishments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun etablissement lie.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
