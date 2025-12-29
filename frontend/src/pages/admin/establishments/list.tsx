import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { MercurialeLevel, UserListRow } from "./types"

type UsersListViewProps = {
  users: UserListRow[]
  onOpenUser: (userId: string) => void
}

const levelLabelMap: Record<MercurialeLevel, string> = {
  STANDARD: "Standard",
  PLUS: "Plus",
  PREMIUM: "Premium",
}

const levelBadgeClass: Record<MercurialeLevel, string> = {
  STANDARD: "border-sky-500/40 text-sky-500",
  PLUS: "border-amber-500/40 text-amber-500",
  PREMIUM: "border-emerald-500/40 text-emerald-500",
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

export function UsersListView({ users, onOpenUser }: UsersListViewProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground">
          Liste des comptes et acces mercuriales associes.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Comptes utilisateurs</CardTitle>
          <CardDescription>
            Cliquez sur un utilisateur pour voir son profil et ses etablissements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-44">Acces mercuriale</TableHead>
                <TableHead className="w-28 text-center">Etablissements</TableHead>
                <TableHead className="w-40">Derniere connexion</TableHead>
                <TableHead className="w-40">Cree le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => onOpenUser(user.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>
                      {user.superAdmin ? (
                        <Badge variant="secondary">Super admin</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    {user.mercurialeLevel ? (
                      <Badge
                        variant="outline"
                        className={levelBadgeClass[user.mercurialeLevel]}
                      >
                        {levelLabelMap[user.mercurialeLevel]}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{user.establishmentCount}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(user.lastLogin)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(user.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun utilisateur disponible.
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
