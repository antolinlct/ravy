import { useEffect, useMemo, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import { AllCommunityModule, ModuleRegistry, themeQuartz } from "ag-grid-community"
import type { ColDef, ICellRendererParams } from "ag-grid-community"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Expand, Shrink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
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

import {
  createMaintenance,
  fetchEstablishments,
  fetchLatestMaintenance,
  fetchLogs,
  updateMaintenance,
} from "./api"

ModuleRegistry.registerModules([AllCommunityModule])

const logsTheme = themeQuartz.withParams({
  accentColor: "#00A2FF",
  backgroundColor: "#000000",
  borderColor: "#108FFF",
  borderRadius: 0,
  browserColorScheme: "dark",
  cellHorizontalPaddingScale: 0.8,
  cellTextColor: "#108FFF",
  columnBorder: true,
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  foregroundColor: "#108FFF",
  headerBackgroundColor: "#21222C",
  headerFontSize: 14,
  headerFontWeight: 700,
  headerTextColor: "#108FFF",
  headerVerticalPaddingScale: 1.5,
  oddRowBackgroundColor: "#000000",
  rangeSelectionBackgroundColor: "#108FFF",
  rangeSelectionBorderColor: "#108FFF",
  rangeSelectionBorderStyle: "dashed",
  rowBorder: true,
  rowVerticalPaddingScale: 1.5,
  sidePanelBorder: true,
  spacing: 4,
  wrapperBorder: true,
  wrapperBorderRadius: 0,
})

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

const toInputDateTime = (value?: string | null) => {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  const pad = (chunk: number) => String(chunk).padStart(2, "0")
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
    parsed.getDate()
  )}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

const toIsoString = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

const stringifyPayload = (payload: unknown) => {
  if (!payload) return null
  if (typeof payload === "string") return payload
  try {
    return JSON.stringify(payload)
  } catch {
    return null
  }
}

export default function AdminLogsPage() {
  const [maintenanceId, setMaintenanceId] = useState<string | null>(null)
  const [maintenance, setMaintenance] = useState<MaintenanceState>({
    isActive: false,
    startDate: "",
    countdownHours: "2",
    message: "",
  })
  const [maintenanceDraft, setMaintenanceDraft] = useState<MaintenanceState>(maintenance)
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false)
  const [maintenanceConfirmOpen, setMaintenanceConfirmOpen] = useState(false)
  const [maintenanceSaving, setMaintenanceSaving] = useState(false)
  const [logsLoading, setLogsLoading] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [establishmentsById, setEstablishmentsById] = useState<Record<string, string>>({})
  const [isLogsFullscreen, setIsLogsFullscreen] = useState(false)
  const [startFilter, setStartFilter] = useState("")
  const [endFilter, setEndFilter] = useState("")

  const canConfirmMaintenance =
    maintenanceDraft.startDate.trim() !== "" &&
    maintenanceDraft.countdownHours.trim() !== "" &&
    maintenanceDraft.message.trim() !== ""

  useEffect(() => {
    let active = true

    const loadMaintenance = async () => {
      try {
        const latest = await fetchLatestMaintenance()
        if (!active) return
        if (!latest) return
        setMaintenanceId(latest.id)
        const nextState: MaintenanceState = {
          isActive: Boolean(latest.is_active),
          startDate: toInputDateTime(latest.start_date),
          countdownHours:
            latest.coutdown_hour === null || latest.coutdown_hour === undefined
              ? ""
              : String(latest.coutdown_hour),
          message: latest.message ?? "",
        }
        setMaintenance(nextState)
        setMaintenanceDraft(nextState)
      } catch (error) {
        if (!active) return
        console.error(error)
        toast.error("Impossible de charger la maintenance.")
      }
    }

    loadMaintenance()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadEstablishments = async () => {
      try {
        const data = await fetchEstablishments()
        if (!active) return
        const nextMap = data.reduce<Record<string, string>>((acc, item) => {
          if (item.id && item.name) {
            acc[item.id] = item.name
          }
          return acc
        }, {})
        setEstablishmentsById(nextMap)
      } catch (error) {
        if (!active) return
        console.error(error)
        toast.error("Impossible de charger les etablissements.")
      }
    }

    loadEstablishments()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    setLogsLoading(true)

    const loadLogs = async () => {
      try {
        const data = await fetchLogs({
          start: startFilter || undefined,
          end: endFilter || undefined,
          limit: 800,
        })
        if (!active) return
        const normalized = data.map<LogEntry>((entry) => {
          const action = (entry.action ?? "view") as LogEntry["action"]
          return {
            id: entry.id,
            createdAt: entry.created_at ?? "",
            userId: entry.user_id ?? null,
            establishmentId: entry.establishment_id ?? null,
            type: entry.type === "job" ? "job" : "context",
            action,
            text: entry.text ?? null,
            json: stringifyPayload(entry.json),
            elementId: entry.element_id ?? null,
            elementType: entry.element_type ?? null,
          }
        })
        setLogs(normalized)
      } catch (error) {
        if (!active) return
        console.error(error)
        toast.error("Impossible de charger les logs.")
        setLogs([])
      } finally {
        if (active) {
          setLogsLoading(false)
        }
      }
    }

    loadLogs()

    return () => {
      active = false
    }
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
        headerName: "Etablissement",
        field: "establishmentId",
        minWidth: 220,
        flex: 1,
        valueFormatter: ({ value }) =>
          value ? establishmentsById[value] ?? "--" : "--",
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
      {
        headerName: "Etablissement ID",
        field: "establishmentId",
        minWidth: 220,
        cellClass: "text-muted-foreground font-mono",
        valueFormatter: ({ value }) => value ?? "--",
      },
    ]
  }, [establishmentsById])

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
                          onClick={async () => {
                            if (maintenanceSaving) return
                            setMaintenanceSaving(true)
                            const countdownValue = Number(maintenanceDraft.countdownHours)
                            const payload = {
                              is_active: true,
                              start_date: toIsoString(maintenanceDraft.startDate),
                              coutdown_hour: Number.isNaN(countdownValue)
                                ? null
                                : countdownValue,
                              message: maintenanceDraft.message || null,
                            }
                            try {
                              const result = maintenanceId
                                ? await updateMaintenance(maintenanceId, payload)
                                : await createMaintenance(payload)
                              setMaintenanceId(result.id)
                              setMaintenance({
                                isActive: Boolean(result.is_active),
                                startDate: toInputDateTime(result.start_date),
                                countdownHours:
                                  result.coutdown_hour === null ||
                                  result.coutdown_hour === undefined
                                    ? ""
                                    : String(result.coutdown_hour),
                                message: result.message ?? "",
                              })
                              toast.success("Maintenance activée.")
                              setMaintenanceConfirmOpen(false)
                              setMaintenanceDialogOpen(false)
                            } catch (error) {
                              console.error(error)
                              toast.error("Impossible d activer la maintenance.")
                            } finally {
                              setMaintenanceSaving(false)
                            }
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
                onClick={async () => {
                  if (maintenanceSaving || !maintenanceId) {
                    setMaintenance((prev) => ({
                      ...prev,
                      isActive: false,
                    }))
                    return
                  }
                  setMaintenanceSaving(true)
                  try {
                    const result = await updateMaintenance(maintenanceId, { is_active: false })
                    setMaintenance((prev) => ({
                      ...prev,
                      isActive: Boolean(result.is_active),
                      startDate: toInputDateTime(result.start_date) || prev.startDate,
                      countdownHours:
                        result.coutdown_hour === null || result.coutdown_hour === undefined
                          ? prev.countdownHours
                          : String(result.coutdown_hour),
                      message: result.message ?? prev.message,
                    }))
                    toast.success("Maintenance désactivée.")
                  } catch (error) {
                    console.error(error)
                    toast.error("Impossible de désactiver la maintenance.")
                  } finally {
                    setMaintenanceSaving(false)
                  }
                }}
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
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setIsLogsFullscreen(true)}
              aria-label="Agrandir les logs"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div style={{ height: 520, width: "100%" }} data-ag-theme-mode="dark">
            <AgGridReact<LogEntry>
              rowData={logsLoading ? [] : logs}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              theme={logsTheme}
              suppressDragLeaveHidesColumns
              domLayout="normal"
            />
          </div>
        </CardContent>
      </Card>
      <Dialog open={isLogsFullscreen} onOpenChange={setIsLogsFullscreen}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 h-[100svh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-6 sm:max-w-none"
        >
          <div className="flex h-full flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">Logs applicatifs</h2>
                <p className="text-sm text-muted-foreground">
                  Filtrez par periode pour analyser un incident precis.
                </p>
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
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    aria-label="Reduire les logs"
                  >
                    <Shrink className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
            <div className="flex-1" data-ag-theme-mode="dark">
              <AgGridReact<LogEntry>
                rowData={logsLoading ? [] : logs}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                theme={logsTheme}
                suppressDragLeaveHidesColumns
                domLayout="normal"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
