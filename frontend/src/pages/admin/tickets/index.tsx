import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type TicketStatus = "open" | "in progress" | "resolved" | "error" | "canceled"

type SupportTicket = {
  id: string
  ticketId: string
  establishmentId: string | null
  userProfileId: string | null
  invoicePath: string | null
  status: TicketStatus
  object: string | null
  description: string | null
  internNotes: string | null
  resolutionNotes: string | null
  createdAt: string
  updatedAt: string | null
  resolvedAt: string | null
}

type TicketClient = {
  name: string
  email: string
  establishmentName: string
  establishmentCity: string
}

type TicketRow = SupportTicket & {
  client: TicketClient
}

type TicketSortKey = "createdAt" | "status"
type TicketSortOrder = "asc" | "desc"

const statusLabels: Record<TicketStatus, string> = {
  open: "Ouvert",
  "in progress": "En cours",
  resolved: "Resolue",
  error: "Erreur",
  canceled: "Annulee",
}

const statusBadgeClass: Record<TicketStatus, string> = {
  open: "border-sky-500/40 text-sky-500",
  "in progress": "border-amber-500/40 text-amber-500",
  resolved: "border-emerald-500/40 text-emerald-500",
  error: "border-red-500/50 text-red-500",
  canceled: "border-muted-foreground/40 text-muted-foreground",
}

const statusRank: Record<TicketStatus, number> = {
  open: 1,
  "in progress": 2,
  error: 3,
  resolved: 4,
  canceled: 5,
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

const ticketsSeed: TicketRow[] = [
  {
    id: "ticket-1",
    ticketId: "TK-2025-00031",
    establishmentId: "est-001",
    userProfileId: "usr-001",
    invoicePath: "/mock/invoices/2025-02-01-00031.pdf",
    status: "open",
    object: "Erreur sur facture Metro",
    description:
      "La facture contient un prix unitaire incoherent sur la ligne tomates grappes.",
    internNotes: "Verifier la mercuriale en vigueur.",
    resolutionNotes: null,
    createdAt: "2025-02-01T08:35",
    updatedAt: "2025-02-01T08:35",
    resolvedAt: null,
    client: {
      name: "Clara Mendes",
      email: "clara.mendes@lacantine.fr",
      establishmentName: "La Cantine Lumiere",
      establishmentCity: "Lyon",
    },
  },
  {
    id: "ticket-2",
    ticketId: "TK-2025-00029",
    establishmentId: "est-002",
    userProfileId: "usr-014",
    invoicePath: null,
    status: "in progress",
    object: "Export comptable incomplet",
    description: "Le CSV exporte des lignes dupliquees.",
    internNotes: "Demander un exemple de fichier.",
    resolutionNotes: null,
    createdAt: "2025-01-30T14:20",
    updatedAt: "2025-01-31T09:40",
    resolvedAt: null,
    client: {
      name: "Hugo Perrin",
      email: "hugo@brasserieduport.fr",
      establishmentName: "Brasserie du Port",
      establishmentCity: "Marseille",
    },
  },
  {
    id: "ticket-3",
    ticketId: "TK-2025-00026",
    establishmentId: "est-003",
    userProfileId: "usr-009",
    invoicePath: "/mock/invoices/2025-01-29-00026.pdf",
    status: "resolved",
    object: "Probleme de connexion",
    description: "Impossible de se connecter depuis Safari.",
    internNotes: null,
    resolutionNotes: "Mot de passe reinitialise et cache navigateur nettoye.",
    createdAt: "2025-01-29T07:10",
    updatedAt: "2025-01-29T10:22",
    resolvedAt: "2025-01-29T10:22",
    client: {
      name: "Maya Lopez",
      email: "maya@cafeperle.fr",
      establishmentName: "Cafe Perle",
      establishmentCity: "Paris",
    },
  },
  {
    id: "ticket-4",
    ticketId: "TK-2025-00024",
    establishmentId: "est-004",
    userProfileId: "usr-022",
    invoicePath: null,
    status: "error",
    object: "Import facture bloque",
    description: "Le fichier reste en statut en attente.",
    internNotes: "Verifier logs job import.",
    resolutionNotes: null,
    createdAt: "2025-01-27T18:42",
    updatedAt: "2025-01-27T19:05",
    resolvedAt: null,
    client: {
      name: "Nicolas Dubois",
      email: "nicolas@chezantonio.fr",
      establishmentName: "Chez Antonio",
      establishmentCity: "Nice",
    },
  },
  {
    id: "ticket-5",
    ticketId: "TK-2025-00019",
    establishmentId: "est-002",
    userProfileId: "usr-014",
    invoicePath: "/mock/invoices/2025-01-22-00019.pdf",
    status: "canceled",
    object: "Question sur la mercuriale",
    description: "Ticket annule apres clarification par telephone.",
    internNotes: null,
    resolutionNotes: "Ticket clos suite appel.",
    createdAt: "2025-01-22T11:05",
    updatedAt: "2025-01-22T12:10",
    resolvedAt: "2025-01-22T12:10",
    client: {
      name: "Louise Armand",
      email: "louise@ateliervert.fr",
      establishmentName: "Atelier Vert",
      establishmentCity: "Bordeaux",
    },
  },
]

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>(ticketsSeed)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<TicketSortKey>("createdAt")
  const [sortOrder, setSortOrder] = useState<TicketSortOrder>("desc")

  const sortedTickets = useMemo(() => {
    const copy = [...tickets]
    copy.sort((a, b) => {
      if (sortKey === "status") {
        const diff = statusRank[a.status] - statusRank[b.status]
        if (diff !== 0) return sortOrder === "asc" ? diff : -diff
      }
      const diff = a.createdAt.localeCompare(b.createdAt, "fr", {
        sensitivity: "base",
      })
      return sortOrder === "asc" ? diff : -diff
    })
    return copy
  }, [tickets, sortKey, sortOrder])

  const selectedTicket = useMemo(() => {
    if (!selectedTicketId) return null
    return tickets.find((ticket) => ticket.id === selectedTicketId) ?? null
  }, [selectedTicketId, tickets])

  const handleStatusChange = (ticketId: string, nextStatus: TicketStatus) => {
    const now = new Date().toISOString()
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: nextStatus,
              updatedAt: now,
              resolvedAt: nextStatus === "resolved" ? now : null,
            }
          : ticket
      )
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary">Tickets</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des demandes clients et gestion des pieces jointes.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Tickets clients</CardTitle>
              <CardDescription>
                Cliquez sur une ligne pour consulter le detail complet.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-2">
                <Label>Tri</Label>
                <Select
                  value={sortKey}
                  onValueChange={(value) => setSortKey(value as TicketSortKey)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date de creation</SelectItem>
                    <SelectItem value="status">Statut</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ordre</Label>
                <Select
                  value={sortOrder}
                  onValueChange={(value) => setSortOrder(value as TicketSortOrder)}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Decroissant</SelectItem>
                    <SelectItem value="asc">Croissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Ticket</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead className="w-56">Client</TableHead>
                <TableHead className="w-32">Statut</TableHead>
                <TableHead className="w-44">Cree le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTickets.map((ticket) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <TableCell className="font-medium">
                    {ticket.ticketId || ticket.id}
                  </TableCell>
                  <TableCell>{ticket.object ?? "--"}</TableCell>
                  <TableCell>{ticket.client.establishmentName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusBadgeClass[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(ticket.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {sortedTickets.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun ticket pour le moment.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) setSelectedTicketId(null)
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTicket?.ticketId || "Ticket"}
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.object ?? "Demande client"}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket ? (
            <div className="grid gap-4">
              <div className="grid gap-3 rounded-lg border border-border p-4">
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Client</span>
                  <span className="font-medium">{selectedTicket.client.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedTicket.client.email}
                  </span>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Etablissement</span>
                  <span className="font-medium">
                    {selectedTicket.client.establishmentName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {selectedTicket.client.establishmentCity}
                  </span>
                </div>
              </div>
              <div className="grid gap-3 rounded-lg border border-border p-4">
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Description</span>
                  <p className="text-sm">{selectedTicket.description ?? "--"}</p>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Notes internes</span>
                  <p className="text-sm text-muted-foreground">
                    {selectedTicket.internNotes ?? "--"}
                  </p>
                </div>
                <div className="grid gap-1">
                  <span className="text-xs text-muted-foreground">Resolution</span>
                  <p className="text-sm text-muted-foreground">
                    {selectedTicket.resolutionNotes ?? "--"}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Statut</Label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) =>
                      handleStatusChange(selectedTicket.id, value as TicketStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(statusLabels).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabels[status as TicketStatus]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Piece jointe</Label>
                  {selectedTicket.invoicePath ? (
                    <Button asChild variant="secondary">
                      <a href={selectedTicket.invoicePath} download>
                        Telecharger la facture
                      </a>
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" disabled>
                      Aucun fichier disponible
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Cree le</span>
                  <span>{formatDateTime(selectedTicket.createdAt)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Mis a jour</span>
                  <span>{formatDateTime(selectedTicket.updatedAt)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Resolue le</span>
                  <span>{formatDateTime(selectedTicket.resolvedAt)}</span>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setSelectedTicketId(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
