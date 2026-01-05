import { useEffect, useMemo, useState } from "react"

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
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

import {
  fetchEstablishments,
  fetchSupportTickets,
  fetchUserProfiles,
  updateSupportTicket,
} from "./api"

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

const extractCity = (address?: string | null) => {
  if (!address) return "--"
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : address
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [statusSavingId, setStatusSavingId] = useState<string | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<TicketSortKey>("createdAt")
  const [sortOrder, setSortOrder] = useState<TicketSortOrder>("desc")

  useEffect(() => {
    let active = true
    setTicketsLoading(true)

    const loadTickets = async () => {
      try {
        const [ticketsData, profiles, establishments] = await Promise.all([
          fetchSupportTickets(),
          fetchUserProfiles(),
          fetchEstablishments(),
        ])

        if (!active) return

        const profileMap = new Map(
          profiles.map((profile) => [profile.id, profile])
        )
        const establishmentMap = new Map(
          establishments.map((establishment) => [establishment.id, establishment])
        )

        const mappedTickets = ticketsData.map<TicketRow>((ticket) => {
          const profile = ticket.user_profile_id
            ? profileMap.get(ticket.user_profile_id)
            : undefined
          const establishment = ticket.establishment_id
            ? establishmentMap.get(ticket.establishment_id)
            : undefined
          const nameParts = [profile?.first_name, profile?.last_name].filter(Boolean)
          const clientName = nameParts.length ? nameParts.join(" ") : "Client inconnu"
          const clientEmail = profile?.email ?? "--"

          return {
            id: ticket.id,
            ticketId: ticket.ticket_id ?? ticket.id,
            establishmentId: ticket.establishment_id ?? null,
            userProfileId: ticket.user_profile_id ?? null,
            invoicePath: ticket.invoice_path ?? null,
            status: (ticket.status ?? "open") as TicketStatus,
            object: ticket.object ?? null,
            description: ticket.description ?? null,
            internNotes: ticket.intern_notes ?? null,
            resolutionNotes: ticket.resolution_notes ?? null,
            createdAt: ticket.created_at ?? "",
            updatedAt: ticket.updated_at ?? null,
            resolvedAt: ticket.resolved_at ?? null,
            client: {
              name: clientName,
              email: clientEmail,
              establishmentName: establishment?.name ?? "--",
              establishmentCity: extractCity(establishment?.full_adresse),
            },
          }
        })

        setTickets(mappedTickets)
      } catch (error) {
        if (!active) return
        console.error(error)
        toast.error("Impossible de charger les tickets.")
      } finally {
        if (active) {
          setTicketsLoading(false)
        }
      }
    }

    loadTickets()

    return () => {
      active = false
    }
  }, [])

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

  const handleStatusChange = async (ticketId: string, nextStatus: TicketStatus) => {
    if (statusSavingId) return
    const now = new Date().toISOString()
    setStatusSavingId(ticketId)
    try {
      const updated = await updateSupportTicket(ticketId, {
        status: nextStatus,
        updated_at: now,
        resolved_at: nextStatus === "resolved" ? now : null,
      })

      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                status: (updated.status ?? nextStatus) as TicketStatus,
                updatedAt: updated.updated_at ?? now,
                resolvedAt:
                  updated.resolved_at ?? (nextStatus === "resolved" ? now : null),
                description: updated.description ?? ticket.description,
                internNotes: updated.intern_notes ?? ticket.internNotes,
                resolutionNotes: updated.resolution_notes ?? ticket.resolutionNotes,
                invoicePath: updated.invoice_path ?? ticket.invoicePath,
              }
            : ticket
        )
      )
      toast.success("Statut mis a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de mettre a jour le ticket.")
    } finally {
      setStatusSavingId(null)
    }
  }

  const handleDownload = async (ticket: TicketRow) => {
    if (!ticket.invoicePath) return
    try {
      const storagePath = ticket.invoicePath.replace(/^tickets\//, "")
      const { data, error } = await supabase.storage
        .from("tickets")
        .createSignedUrl(storagePath, 120)
      if (error || !data?.signedUrl) {
        toast.error("Telechargement impossible.")
        return
      }
      const link = document.createElement("a")
      link.href = data.signedUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.download = ticket.ticketId || ticket.id
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error(error)
      toast.error("Telechargement impossible.")
    }
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
              {ticketsLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Chargement des tickets...
                  </TableCell>
                </TableRow>
              ) : (
                <>
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
                </>
              )}
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
                    disabled={statusSavingId === selectedTicket.id}
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
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDownload(selectedTicket)}
                    >
                      Telecharger la facture
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
