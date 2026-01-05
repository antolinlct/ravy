"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEstablishment } from "@/context/EstablishmentContext"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"

type Ticket = {
  backendId: string
  id: string
  subject: string
  status: "open" | "in progress" | "resolved" | "error" | "canceled"
  statusLabel: string
  date: string
  description?: string
  invoice_path?: string | null
}

type ApiSupportTicket = {
  id?: string | null
  ticket_id?: string | null
  object?: string | null
  status?: Ticket["status"] | null
  created_at?: string | null
  description?: string | null
  invoice_path?: string | null
}

export default function TicketSupportPage() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [data, setData] = React.useState<Ticket[]>([])
  const { estId } = useEstablishment()
  const [estPrefix, setEstPrefix] = React.useState("XX")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Ticket | null>(null)
  const [form, setForm] = React.useState({
    subject: "",
    description: "",
    status: "open" as Ticket["status"],
  })
  const [saving, setSaving] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [formError, setFormError] = React.useState<string>("")

  React.useEffect(() => {
    if (!estId) return
    let active = true

    async function load() {
      try {
        const API_URL = import.meta.env.VITE_API_URL
        const res = await fetch(
          `${API_URL}/support_ticket?establishment_id=${estId}`
        )
        if (!active || !res.ok) return
        const list = await res.json()
        if (!Array.isArray(list)) return

        const mapped: Ticket[] = list.map((t: ApiSupportTicket) => {
          const status = (t.status as Ticket["status"]) ?? "open"
          const statusLabel =
            status === "in progress"
              ? "En cours"
              : status === "resolved"
                ? "Résolu"
                : status === "canceled"
                  ? "Annulé"
                  : status === "error"
                    ? "Erreur"
                    : "Ouvert"
          const created = t.created_at ? new Date(t.created_at) : null
          const date = created
            ? created.toLocaleDateString("fr-FR")
            : ""

          return {
            backendId: t.id,
            id: t.ticket_id || "",
            subject: t.object || "Sans objet",
            status,
            statusLabel,
            date,
            description: t.description || "",
            invoice_path: t.invoice_path || null,
          }
        })
        setData(mapped)
      } catch {
        /* ignore load errors */
      }
    }

    load()
    return () => {
      active = false
    }
  }, [estId])

  React.useEffect(() => {
    if (!estId) return
    let mounted = true
    async function loadEstablishment() {
      try {
        const API_URL = import.meta.env.VITE_API_URL
        const res = await fetch(`${API_URL}/establishments/${estId}`)
        if (!mounted || !res.ok) return
        const est = await res.json().catch(() => null)
        const prefix =
          (est?.name ? String(est.name).slice(0, 2).toUpperCase() : "") || "XX"
        setEstPrefix(prefix)
      } catch {
        /* ignore */
      }
    }
    loadEstablishment()
    return () => {
      mounted = false
    }
  }, [estId])

  function openCreateDialog() {
    setSelected(null)
    setForm({
      subject: "",
      description: "",
      status: "open",
    })
    setFormError("")
    setFile(null)
    setDialogOpen(true)
  }

  const openViewDialog = React.useCallback((ticket: Ticket) => {
    setSelected(ticket)
    setForm({
      subject: ticket.subject,
      description: ticket.description || "",
      status: ticket.status,
    })
    setFormError("")
    setFile(null)
    setDialogOpen(true)
  }, [])

  function generateTicketId() {
    const random = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, "0")
    return `T-${estPrefix}-${random}`
  }

  async function uploadInvoice(): Promise<string | null> {
    if (!file || !estId) return null
    setUploading(true)
    try {
      const safeName = file.name.replace(/\s+/g, "-")
      const path = `${estId}/${Date.now()}-${safeName}`
      const { data, error } = await supabase.storage
        .from("tickets")
        .upload(path, file, { upsert: true })
      if (error) {
        toast.error("Impossible de téléverser le document.")
        return null
      }
      return data?.fullPath ?? data?.path ?? path
    } finally {
      setUploading(false)
    }
  }

  async function handleCreate() {
    if (!estId || !form.subject.trim() || !form.description.trim()) {
      setFormError("Objet et description requis.")
      return
    }
    setFormError("")
    setSaving(true)
    try {
      const ticketId = generateTicketId()
      const invoicePath = await uploadInvoice()
      const API_URL = import.meta.env.VITE_API_URL
      const payload = {
        establishment_id: estId,
        ticket_id: ticketId,
        object: form.subject.trim(),
        description: form.description || null,
        status: "open",
        invoice_path: invoicePath,
      }
      const res = await fetch(`${API_URL}/support_ticket/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        toast.error("Impossible de créer le ticket.")
        return
      }
      toast.success("Ticket créé.")
      setDialogOpen(false)
      // reload list
      const created = await res.json().catch(() => null)
      if (created) {
        const statusLabel = "Ouvert"
        const createdDate = created.created_at ? new Date(created.created_at) : new Date()
        const date = createdDate.toLocaleDateString("fr-FR")
        setData((prev) => [
          {
            backendId: created.id || "",
            id: created.ticket_id || ticketId,
            subject: created.object || payload.object,
            status: created.status || "open",
            statusLabel,
            date,
            description: created.description || "",
            invoice_path: created.invoice_path || invoicePath || null,
          },
          ...prev,
        ])
      }
    } catch {
      toast.error("Impossible de créer le ticket.")
    } finally {
      setSaving(false)
    }
  }

  const cancelTicket = React.useCallback(async (ticket: Ticket) => {
    if (!ticket.backendId) {
      toast.error("Impossible d'annuler ce ticket.")
      return
    }
    if (ticket.status === "resolved" || ticket.status === "error") {
      toast.error("Ce ticket ne peut pas être annulé.")
      return
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/support_ticket/${ticket.backendId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "canceled" }),
      })
      if (!res.ok) {
        toast.error("Annulation impossible.")
        return
      }
      toast.success("Ticket annulé.")
      setData((prev) =>
        prev.map((t) =>
          t.backendId === ticket.backendId
            ? {
                ...t,
                status: "canceled",
                statusLabel: "Annulé",
              }
            : t
        )
      )
    } catch {
      toast.error("Annulation impossible.")
    }
  }, [])

  const restoreTicket = React.useCallback(async (ticket: Ticket) => {
    if (!ticket.backendId) {
      toast.error("Impossible de rétablir ce ticket.")
      return
    }
    if (ticket.status === "resolved" || ticket.status === "error") {
      toast.error("Ce ticket ne peut pas être rétabli.")
      return
    }
    try {
      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/support_ticket/${ticket.backendId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "open" }),
      })
      if (!res.ok) {
        toast.error("Rétablissement impossible.")
        return
      }
      toast.success("Ticket rétabli.")
      setData((prev) =>
        prev.map((t) =>
          t.backendId === ticket.backendId
            ? {
                ...t,
                status: "open",
                statusLabel: "Ouvert",
              }
            : t
        )
      )
    } catch {
      toast.error("Rétablissement impossible.")
    }
  }, [])

  async function downloadTicketFile() {
    if (!selected?.invoice_path) return
    try {
      // Supprime le préfixe du bucket si présent (createSignedUrl attend un chemin relatif)
      const storagePath = selected.invoice_path.replace(/^tickets\//, "")
      const { data, error } = await supabase.storage
        .from("tickets")
        .createSignedUrl(storagePath, 120)
      if (error || !data?.signedUrl) {
        toast.error("Téléchargement impossible.")
        return
      }
      const link = document.createElement("a")
      link.href = data.signedUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.download = selected.id || "ticket"
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error("Téléchargement impossible.")
    }
  }

  const columns: ColumnDef<Ticket>[] = React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="font-medium">{row.getValue("id")}</span>,
      },
      {
        accessorKey: "subject",
        header: "Sujet",
      },
      {
        accessorKey: "statusLabel",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Statut
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.original.status
          const colors =
            status === "open"
              ? "bg-slate-500/15 text-slate-700"
              : status === "in progress"
                ? "bg-blue-500/15 text-blue-700"
                : status === "resolved"
                  ? "bg-green-500/15 text-green-700"
                  : status === "canceled"
                    ? "bg-red-500/15 text-red-700"
                    : status === "error"
                      ? "bg-amber-500/15 text-amber-700"
                      : "bg-slate-500/15 text-slate-700"

          return (
            <Badge className={`pointer-events-none border-none ${colors}`}>
              {row.original.statusLabel}
            </Badge>
          )
        },
      },
      {
        accessorKey: "date",
        header: "Date",
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const ticket = row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Ouvrir le menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    openViewDialog(ticket)
                  }}
                >
                  Voir le ticket
                </DropdownMenuItem>
                {ticket.status === "canceled" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      restoreTicket(ticket)
                    }}
                  >
                    Rétablir le ticket
                  </DropdownMenuItem>
                )}
                {ticket.status !== "canceled" &&
                  ticket.status !== "resolved" &&
                  ticket.status !== "error" && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        cancelTicket(ticket)
                      }}
                    >
                      Annuler le ticket
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [openViewDialog, cancelTicket, restoreTicket]
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex items-start justify-start bg-sidebar rounded-xl gap-4 p-4">
      <div className="w-full max-w-5xl space-y-4">
        <Card>
          <CardHeader className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="mb-1">Tickets</CardTitle>
              <CardDescription>Suivez et gérez vos demandes de support.</CardDescription>
            </div>
            <Button type="button" onClick={openCreateDialog}>
              Créer un ticket
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="cursor-pointer"
                        onClick={() => openViewDialog(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        Aucune demande de support créée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selected ? `Ticket ${selected.id}` : "Nouveau ticket"}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? "Consultation du ticket. Les champs ne sont pas modifiables."
                : "Créez un ticket de support."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {selected && (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                {selected.status === "open"
                  ? "Le ticket a bien été reçu par notre équipe."
                  : selected.status === "in progress"
                    ? "Le ticket est en cours de résolution par notre équipe."
                    : selected.status === "resolved"
                      ? "Le ticket a été résolu."
                      : selected.status === "canceled"
                      ? "Le ticket a été annulé."
                      : selected.status === "error"
                        ? "Le ticket a rencontré une erreur."
                        : "Le ticket est en attente de traitement."}
              </p>
            )}
            {formError && !selected && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="ticket-object">Objet</Label>
              <Input
                id="ticket-object"
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                disabled={Boolean(selected)}
                className="disabled:text-foreground disabled:opacity-100"
                placeholder="Objet du ticket"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ticket-description">Description</Label>
              <Textarea
                id="ticket-description"
                required
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={Boolean(selected)}
                className="disabled:text-foreground disabled:opacity-100"
                placeholder="Décrivez le problème"
              />
            </div>
            {!selected && (
              <div className="grid gap-2">
                <Label htmlFor="ticket-file">Document / facture (optionnel)</Label>
                <Input
                  id="ticket-file"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={Boolean(selected)}
                  className="h-12 border-2 border-dashed text-center"
                />
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            {!selected && (
              <Button
                type="button"
                onClick={handleCreate}
                disabled={
                  saving ||
                  uploading ||
                  !form.subject.trim() ||
                  !form.description.trim()
                }
              >
                Créer
              </Button>
            )}
            {selected?.invoice_path && (
              <Button type="button" variant="outline" onClick={downloadTicketFile}>
                Voir le document
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
