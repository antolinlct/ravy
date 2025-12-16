import { ArrowLeft, Info, Group, BookOpen, Merge } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import { Switch } from "@/components/ui/switch"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"


type MergeRequest = {
  id: string
  date: string
  target: string
  sources: string[]
  status: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([
    { id: "1", name: "France Boissons", invoicesCount: 24, label: "Frais généraux", labelTone: "outline", analyses: true },
    { id: "2", name: "PepsiCo France", invoicesCount: 12, label: "Coûts variables", labelTone: "secondary", analyses: true },
    { id: "3", name: "Metro", invoicesCount: 18, label: "Nourriture", labelTone: "default", analyses: false },
    { id: "4", name: "Coca-Cola", invoicesCount: 9, label: "Boissons", labelTone: "outline", analyses: true },
  ])
  const [supplierFilter, setSupplierFilter] = useState<string[]>([])
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeSources, setMergeSources] = useState<string[]>([])
  const [mergeTarget, setMergeTarget] = useState<string>("")
  const [mergeSheetOpen, setMergeSheetOpen] = useState(false)
  const [mergeDetail, setMergeDetail] = useState<MergeRequest | null>(null)
  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ value: s.id, label: s.name })),
    [suppliers]
  )
  const mergeRequests: MergeRequest[] = [
    {
      id: "req-1",
      date: "12/03/2024",
      target: "France Boissons",
      sources: ["PepsiCo France", "Coca-Cola"],
      status: "En attente",
    },
    {
      id: "req-2",
      date: "28/02/2024",
      target: "Metro",
      sources: ["Fournisseur X"],
      status: "Validée",
    },
  ]

  const resetMerge = () => {
    setMergeSources([])
    setMergeTarget("")
  }

  const toggleAnalyses = (id: string, next: boolean) => {
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === id ? { ...supplier, analyses: next } : supplier
      )
    )
    const supplierName = suppliers.find((s) => s.id === id)?.name || "Fournisseur"
    if (next) {
      toast.success(`Analyses activées pour ${supplierName}.`)
    } else {
      toast.error(`Analyses désactivées pour ${supplierName}.`)
    }
  }

  const labelOptions = [
    { value: "Alimentaire", tone: "default" as const },
    { value: "Boissons", tone: "outline" as const },
    { value: "Charges fixes", tone: "secondary" as const },
    { value: "Charges variables", tone: "secondary" as const },
    { value: "Autres", tone: "outline" as const },
  ]

  const labelStyle = (value: string) => {
    const base =
      "justify-between border text-xs font-medium px-2 py-2 rounded-md transition-colors h-7 w-auto text-left"
    const map: Record<string, string> = {
      Alimentaire: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      Boissons: "bg-sky-500/10 text-sky-500 border-sky-500/30",
      "Charges fixes": "bg-rose-500/10 text-rose-500 border-rose-500/30",
      "Charges variables": "bg-amber-500/10 text-amber-600 border-amber-500/30",
      Autres: "bg-muted/40 text-foreground border-border",
      "Frais généraux": "bg-muted/40 text-foreground border-border",
    }
    return `${base} ${map[value] ?? "bg-muted/40 text-foreground border-border"}`
  }

  const handleLabelChange = (id: string, value: string) => {
    const tone = labelOptions.find((opt) => opt.value === value)?.tone ?? "outline"
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === id ? { ...supplier, label: value, labelTone: tone } : supplier
      )
    )
    const supplierName = suppliers.find((s) => s.id === id)?.name || "Fournisseur"
    toast(`Label mis à jour pour ${supplierName}.`, {
      icon: <Info className="h-4 w-4 text-muted-foreground" />,
      description: `Nouveau label : ${value}`,
    })
  }

  const handleMergeSourcesChange = (values: string[]) => {
    // If target is among the selected sources, remove it to avoid conflicts
    const next = mergeTarget ? values.filter((v) => v !== mergeTarget) : values
    setMergeSources(next)
  }

  const handleMergeTargetChange = (value: string) => {
    setMergeTarget(value)
    if (mergeSources.includes(value)) {
      setMergeSources((prev) => prev.filter((v) => v !== value))
    }
  }

  const handleMergeSubmit = () => {
    const targetName = suppliers.find((s) => s.id === mergeTarget)?.name ?? "fournisseur cible"
    const sources = suppliers.filter((s) => mergeSources.includes(s.id)).map((s) => s.name)
    toast.success(`Regroupement lancé vers ${targetName}`, {
      description: sources.length ? `Sources : ${sources.join(", ")}` : undefined,
    })
    setMergeOpen(false)
    resetMerge()
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" size="icon" className="h-10 w-10">
          <Link to="/dashboard/invoices">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            <span className="sr-only">Retour</span>
          </Link>
        </Button>
        <div className="flex-1">
          <p className="text-2xl font-semibold">Fournisseurs</p>
          <p className="text-muted-foreground">Gérez les fournisseurs associés à vos factures.</p>
        </div>
        <Button variant="outline">
          Aide & Tutoriels
          <BookOpen className="h-4 w-4" />
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Gérez vos fournisseurs</CardTitle>
              <CardDescription>
                Consultez et modifiez vos fournisseurs. Les filtres ci-dessous n&apos;affectent que cette liste.
              </CardDescription>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Les fournisseurs labellisés servent dans les analyses de factures. Ajoutez des alias pour éviter les doublons.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-2">
              <Label className="text-foreground">Filtrer par fournisseur</Label>
              <MultipleCombobox
                className="w-[350px]"
                placeholder="Sélectionner des fournisseurs"
                items={supplierOptions}
                value={supplierFilter}
                onChange={setSupplierFilter}
              />
            </div>
            <Sheet
              open={mergeSheetOpen}
              onOpenChange={(open) => {
                setMergeSheetOpen(open)
                if (!open) {
                  setMergeOpen(false)
                  resetMerge()
                }
              }}
            >
              <SheetTrigger asChild>
                <Button className="gap-2">
                  Regrouper des fournisseurs
                  <Group className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full space-y-6 sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Regrouper des fournisseurs</SheetTitle>
                  <SheetDescription>
                    Consultez vos demandes et lancez un nouveau regroupement sans quitter la page.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Demandes de regroupement</p>
                    <Badge variant="secondary">{mergeRequests.length} suivi{mergeRequests.length > 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="overflow-hidden rounded-md border bg-muted/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="px-3">Date</TableHead>
                          <TableHead className="px-3">Cible</TableHead>
                          <TableHead className="px-3">Sources</TableHead>
                          <TableHead className="px-3">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mergeRequests.map((req) => {
                          const statusClass =
                            req.status === "Validée"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : req.status === "En attente"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-destructive/10 text-destructive border-destructive/30"
                          return (
                            <TableRow
                              key={req.id}
                              className="cursor-pointer h-12"
                              onClick={() => setMergeDetail(req)}
                            >
                              <TableCell className="px-3 text-sm">{req.date}</TableCell>
                              <TableCell className="px-3 text-sm font-medium">{req.target}</TableCell>
                              <TableCell className="px-3 text-sm text-muted-foreground">
                                {req.sources.length} fournisseur{req.sources.length > 1 ? "s" : ""}
                              </TableCell>
                              <TableCell className="px-3">
                                <Badge variant="outline" className={statusClass}>
                                  {req.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Dialog
                  open={mergeOpen}
                  onOpenChange={(open) => {
                    setMergeOpen(open)
                    if (!open) resetMerge()
                  }}
                >
                  <DialogTrigger asChild>
                    <Button className="gap-2 self-start">
                      Faire une demande de regroupement
                      <Merge className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Regrouper des fournisseurs</DialogTitle>
                      <DialogDescription>
                        Un de vos fournisseur a été dupliqué ? Regroupez ses factures et données sous un seul fournisseur cible (irréversible).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-foreground">Fournisseurs source</Label>
                        <MultipleCombobox
                          className="w-full"
                          triggerClassName="h-20 min-h-20"
                          maxShownItems={6}
                          placeholder="Sélectionner les fournisseurs à fusionner"
                          items={supplierOptions}
                          value={mergeSources}
                          onChange={handleMergeSourcesChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          {mergeSources.length} fournisseurs sélectionné{mergeSources.length > 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground text-xs">
                        <Merge className="h-6 w-6 rotate-180" />
                        <span>Vers</span>
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-foreground">Fournisseur cible (unique)</Label>
                        <Select value={mergeTarget} onValueChange={handleMergeTargetChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisir le fournisseur cible" />
                          </SelectTrigger>
                          <SelectContent>
                            {supplierOptions
                              .filter((opt) => !mergeSources.includes(opt.value))
                              .map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Le fournisseur ciblé ne peut pas être dans les fournisseurs sources.
                        </p>
                      </div>
                      <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Les factures et données des fournisseurs source seront associées au fournisseur ciblé sélectionné.
                        Une fois validée, la demande sera traitée par notre équipe sous réserve.
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => { setMergeOpen(false); resetMerge(); }}>
                          Annuler
                        </Button>
                        <Button onClick={handleMergeSubmit} disabled={!mergeTarget || !mergeSources.length}>
                          Faire une demande de regroupement
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={Boolean(mergeDetail)} onOpenChange={(open) => !open && setMergeDetail(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Détail de la demande</DialogTitle>
                      <DialogDescription>Sources et cible de ce regroupement.</DialogDescription>
                    </DialogHeader>
                    {mergeDetail && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Date :</span>
                          <span className="font-medium">{mergeDetail.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Cible :</span>
                          <span className="font-medium">{mergeDetail.target}</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Sources</p>
                          <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
                            {mergeDetail.sources.map((source) => (
                              <li key={source}>{source}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Statut :</span>
                          <Badge
                            variant="outline"
                            className={
                              mergeDetail.status === "Validée"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : mergeDetail.status === "En attente"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-destructive/10 text-destructive border-destructive/30"
                            }
                          >
                            {mergeDetail.status}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </SheetContent>
            </Sheet>
          </div>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%] text-left px-4">Fournisseur</TableHead>
                  <TableHead className="w-[25%] text-left px-3">Label</TableHead>
                  <TableHead className="w-[15%] text-center px-3">Analyses</TableHead>
                  <TableHead className="w-[10%] px-3" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers
                  .filter((s) => !supplierFilter.length || supplierFilter.includes(s.id))
                  .map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      className="cursor-pointer"
                    >
                      <TableCell className="px-4">
                        <div className="space-y-1">
                          <p className="font-medium leading-tight">{supplier.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {supplier.invoicesCount} factures associées
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-left px-3 whitespace-nowrap">
                        <Select
                          value={supplier.label}
                          onValueChange={(val) => handleLabelChange(supplier.id, val)}
                        >
                          <SelectTrigger className={labelStyle(supplier.label)}>
                            <SelectValue placeholder="Choisir un label" />
                          </SelectTrigger>
                          <SelectContent>
                            {labelOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center px-3">
                        <Switch
                          checked={supplier.analyses}
                          onCheckedChange={(checked) => toggleAnalyses(supplier.id, Boolean(checked))}
                          aria-label={`Activer analyses pour ${supplier.name}`}
                        />
                      </TableCell>
                      <TableCell className="px-3" />
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
