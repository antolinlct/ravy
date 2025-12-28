import { useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type { ColDef, ICellRendererParams } from "ag-grid-community"

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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

ModuleRegistry.registerModules([AllCommunityModule])

type MaintenanceState = {
  isActive: boolean
  startDate: string
  countdownHours: string
  message: string
}

type LogEntry = {
  id: string
  createdAt: string
  userId: string | null
  establishmentId: string | null
  type: "context" | "job"
  action: "login" | "logout" | "create" | "update" | "delete" | "view" | "import"
  text: string | null
  json: string | null
  elementId: string | null
  elementType:
    | "invoice"
    | "recipe"
    | "supplier"
    | "financial_reports"
    | "user"
    | "establishment"
    | "variation"
    | null
}

const formatDateTime = (value: string) => {
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

const logSeed: LogEntry[] = [
  {
    id: "log-1",
    createdAt: "2025-02-02T09:12",
    userId: "9c08b3e2-8af8-4d43-9e0f-7d7e0a1b9d7a",
    establishmentId: "1a3a6f5a-3c0e-4b16-93c4-1eaf19f7c6fa",
    type: "context",
    action: "login",
    text: "Connexion réussie depuis Chrome.",
    json: "{\"ip\":\"89.83.12.44\",\"device\":\"desktop\"}",
    elementId: null,
    elementType: "user",
  },
  {
    id: "log-2",
    createdAt: "2025-02-02T10:45",
    userId: "4e4f1d89-20a6-4c55-8b7d-3cbd8f511f6f",
    establishmentId: "1a3a6f5a-3c0e-4b16-93c4-1eaf19f7c6fa",
    type: "context",
    action: "update",
    text: "Mise a jour du fournisseur Metro.",
    json: "{\"field\":\"contact_email\"}",
    elementId: "sup-1",
    elementType: "supplier",
  },
  {
    id: "log-3",
    createdAt: "2025-02-02T12:08",
    userId: null,
    establishmentId: null,
    type: "job",
    action: "import",
    text: "Import facture nocturne termine.",
    json: "{\"file\":\"invoices_2025-02-02.csv\"}",
    elementId: "inv-772",
    elementType: "invoice",
  },
  {
    id: "log-4",
    createdAt: "2025-02-02T14:22",
    userId: "6c7a52c4-7706-4b1e-9557-7fb1f35c9b2a",
    establishmentId: "6d7a0bb4-2c8d-42d2-a865-06b8d1e2fa9f",
    type: "context",
    action: "create",
    text: "Ajout d une nouvelle variation.",
    json: "{\"variationId\":\"var-2025\"}",
    elementId: "var-2025",
    elementType: "variation",
  },
  {
    id: "log-5",
    createdAt: "2025-02-02T16:51",
    userId: "9c08b3e2-8af8-4d43-9e0f-7d7e0a1b9d7a",
    establishmentId: "1a3a6f5a-3c0e-4b16-93c4-1eaf19f7c6fa",
    type: "context",
    action: "delete",
    text: "Suppression d une recette interne.",
    json: "{\"recipeId\":\"rec-418\"}",
    elementId: "rec-418",
    elementType: "recipe",
  },
  {
    id: "log-6",
    createdAt: "2025-02-02T18:05",
    userId: null,
    establishmentId: null,
    type: "job",
    action: "update",
    text: "Synchronisation nocturne des etablissements.",
    json: "{\"updated\":24}",
    elementId: null,
    elementType: "establishment",
  },
]

const typeBadgeMap: Record<LogEntry["type"], "default" | "secondary"> = {
  context: "secondary",
  job: "default",
}

const actionBadgeMap: Partial<Record<LogEntry["action"], "default" | "secondary">> = {
  login: "secondary",
  logout: "secondary",
  create: "default",
  update: "default",
  delete: "default",
  view: "secondary",
  import: "default",
}

export default function AdminLogsPage() {
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    isActive: false,
    startDate: "",
    countdownHours: "2",
    message: "",
  })
  const [maintenanceDraft, setMaintenanceDraft] = useState<MaintenanceState>(maintenance)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false)
  const [startFilter, setStartFilter] = useState("")
  const [endFilter, setEndFilter] = useState("")

  const canConfirmMaintenance =
    maintenanceDraft.startDate.trim() !== "" &&
    maintenanceDraft.countdownHours.trim() !== "" &&
    maintenanceDraft.message.trim() !== ""

  const filteredLogs = useMemo(() => {
    const startMs = startFilter ? new Date(startFilter).getTime() : null
    const endMs = endFilter ? new Date(endFilter).getTime() : null

    return logSeed.filter((entry) => {
      const entryMs = new Date(entry.createdAt).getTime()
      if (Number.isNaN(entryMs)) return false
      if (startMs !== null && entryMs < startMs) return false
      if (endMs !== null && entryMs > endMs) return false
      return true
    })
  }, [startFilter, endFilter])

  const columnDefs = useMemo<ColDef<LogEntry>[]>(() => {
    return [
      {
        headerName: "Date",
        field: "createdAt",
        minWidth: 180,
        sort: "desc",
        valueFormatter: ({ value }) => (value ? formatDateTime(value) : "--"),
      },
      {
        headerName: "Type",
        field: "type",
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<LogEntry>) => (
          <Badge variant={typeBadgeMap[params.value as LogEntry["type"]] ?? "secondary"}>
            {params.value ?? "--"}
          </Badge>
        ),
      },
      {
        headerName: "Action",
        field: "action",
        minWidth: 120,
        cellRenderer: (params: ICellRendererParams<LogEntry>) => (
          <Badge variant={actionBadgeMap[params.value as LogEntry["action"]] ?? "secondary"}>
            {params.value ?? "--"}
          </Badge>
        ),
      },
      {
        headerName: "Element",
        field: "elementType",
        minWidth: 160,
        valueFormatter: ({ value }) => value ?? "--",
      },
      {
        headerName: "Message",
        field: "text",
        minWidth: 280,
        flex: 2,
        valueFormatter: ({ value }) => value ?? "--",
      },
      {
        headerName: "Utilisateur",
        field: "userId",
        minWidth: 200,
        cellClass: "text-muted-foreground font-mono",
        valueFormatter: ({ value }) => value ?? "--",
      },
      {
        headerName: "Etablissement",
        field: "establishmentId",
        minWidth: 200,
        cellClass: "text-muted-foreground font-mono",
        valueFormatter: ({ value }) => value ?? "--",
      },
      {
        headerName: "Element ID",
        field: "elementId",
        minWidth: 200,
        cellClass: "text-muted-foreground font-mono",
        valueFormatter: ({ value }) => value ?? "--",
      },
      {
        headerName: "Payload",
        field: "json",
        minWidth: 220,
        flex: 1,
        cellClass: "text-muted-foreground font-mono",
        valueFormatter: ({ value }) => value ?? "--",
      },
      {
        headerName: "Log ID",
        field: "id",
        minWidth: 220,
        cellClass: "text-muted-foreground font-mono",
      },
    ]
  }, [])

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      sortable: true,
      resizable: true,
      filter: true,
      minWidth: 120,
    }
  }, [])

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-primary">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Supervision technique, maintenance et suivi des actions.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>
                Activez une maintenance planifiee et communiquez un message clair.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={maintenance.isActive ? "default" : "secondary"}>
                {maintenance.isActive ? "Active" : "Inactive"}
              </Badge>
              <Dialog
                open={maintenanceDialogOpen}
                onOpenChange={(open) => {
                  setMaintenanceDialogOpen(open)
                  if (open) {
                    setMaintenanceDraft(maintenance)
                  } else {
                    setMaintenanceConfirmOpen(false)
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button type="button" variant="secondary">
                    Configurer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Configurer la maintenance</DialogTitle>
                    <DialogDescription>
                      Renseignez tous les champs avant d activer la maintenance.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Debut</Label>
                      <Input
                        type="datetime-local"
                        value={maintenanceDraft.startDate}
                        onChange={(event) =>
                          setMaintenanceDraft((prev) => ({
                            ...prev,
                            startDate: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Countdown (heures)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={maintenanceDraft.countdownHours}
                        onChange={(event) =>
                          setMaintenanceDraft((prev) => ({
                            ...prev,
                            countdownHours: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Message</Label>
                      <Textarea
                        value={maintenanceDraft.message}
                        onChange={(event) =>
                          setMaintenanceDraft((prev) => ({
                            ...prev,
                            message: event.target.value,
                          }))
                        }
                        placeholder="Maintenance prevue, merci de votre patience."
                        className="min-h-28"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setMaintenanceDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setMaintenanceConfirmOpen(true)}
                      disabled={!canConfirmMaintenance}
                    >
                      Activer
                    </Button>
                  </DialogFooter>
                  <AlertDialog
                    open={maintenanceConfirmOpen}
                    onOpenChange={setMaintenanceConfirmOpen}
                  >
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la maintenance</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action activera la maintenance pour les utilisateurs.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            setMaintenance({
                              ...maintenanceDraft,
                              isActive: true,
                            })
                            setMaintenanceConfirmOpen(false)
                            setMaintenanceDialogOpen(false)
                          }}
                        >
                          Confirmer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DialogContent>
              </Dialog>
              <Button
                type="button"
                variant="secondary"
                disabled={!maintenance.isActive}
                onClick={() =>
                  setMaintenance((prev) => ({
                    ...prev,
                    isActive: false,
                  }))
                }
              >
                Desactiver
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label>Debut</Label>
            <p className="text-sm text-muted-foreground">
              {maintenance.startDate ? formatDateTime(maintenance.startDate) : "--"}
            </p>
          </div>
          <div className="space-y-1">
            <Label>Countdown</Label>
            <p className="text-sm text-muted-foreground">
              {maintenance.countdownHours ? `${maintenance.countdownHours}h` : "--"}
            </p>
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label>Message</Label>
            <p className="text-sm text-muted-foreground">
              {maintenance.message || "--"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="space-y-1">
            <CardTitle>Logs applicatifs</CardTitle>
            <CardDescription>
              Filtrez par periode pour analyser un incident precis.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label>Debut</Label>
              <Input
                type="datetime-local"
                value={startFilter}
                onChange={(event) => setStartFilter(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input
                type="datetime-local"
                value={endFilter}
                onChange={(event) => setEndFilter(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStartFilter("")
                setEndFilter("")
              }}
            >
              Reinitialiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: 520, width: "100%" }} data-ag-theme-mode="dark">
            <AgGridReact<LogEntry>
              rowData={filteredLogs}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              theme={themeQuartz}
              suppressDragLeaveHidesColumns
              domLayout="normal"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
