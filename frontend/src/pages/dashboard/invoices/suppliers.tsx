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
import { useEffect, useState } from "react"
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
import { useEstablishment } from "@/context/EstablishmentContext"
import {
  createSupplierMergeRequest,
  supplierLabelOptions,
  updateSupplier,
  useSuppliersData,
} from "./api"
import type { MergeRequest, SupplierRow } from "./types"

export default function SuppliersPage() {
  const { estId } = useEstablishment()
  const {
    suppliers: fetchedSuppliers,
    supplierOptions,
    mergeRequests,
    refresh,
  } = useSuppliersData(estId)
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [supplierFilter, setSupplierFilter] = useState<string[]>([])
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeSources, setMergeSources] = useState<string[]>([])
  const [mergeTarget, setMergeTarget] = useState<string>("")
  const [mergeSheetOpen, setMergeSheetOpen] = useState(false)
  const [mergeDetail, setMergeDetail] = useState<MergeRequest | null>(null)
  useEffect(() => {
    setSuppliers(fetchedSuppliers)
  }, [fetchedSuppliers])

  const resetMerge = () => {
    setMergeSources([])
    setMergeTarget("")
  }

  const toggleAnalyses = async (id: string, next: boolean) => {
    const previous = suppliers.find((s) => s.id === id)?.analyses ?? false
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === id ? { ...supplier, analyses: next } : supplier
      )
    )
    const supplierName = suppliers.find((s) => s.id === id)?.name || "Fournisseur"
    try {
      await updateSupplier(id, { active_analyses: next })
      if (next) {
        toast.success(`Analyses activées pour ${supplierName}.`)
      } else {
        toast.error(`Analyses désactivées pour ${supplierName}.`)
      }
    } catch {
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === id ? { ...supplier, analyses: previous } : supplier
        )
      )
      toast.error("Impossible de mettre à jour l'analyse.")
    }
  }

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

  const handleLabelChange = async (id: string, value: string) => {
    const option = supplierLabelOptions.find((opt) => opt.label === value)
    const tone = option?.tone ?? "outline"
    const previousLabel = suppliers.find((s) => s.id === id)?.labelValue ?? null
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === id
          ? { ...supplier, label: value, labelValue: option?.value ?? null, labelTone: tone }
          : supplier
      )
    )
    const supplierName = suppliers.find((s) => s.id === id)?.name || "Fournisseur"
    try {
      await updateSupplier(id, { label: option?.value ?? null })
      toast(`Label mis à jour pour ${supplierName}.`, {
        icon: <Info className="h-4 w-4 text-muted-foreground" />,
        description: `Nouveau label : ${value}`,
      })
    } catch {
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === id
            ? {
                ...supplier,
                labelValue: previousLabel,
                label: supplierLabelOptions.find((opt) => opt.value === previousLabel)?.label ?? "Autres",
                labelTone: supplierLabelOptions.find((opt) => opt.value === previousLabel)?.tone ?? "outline",
              }
            : supplier
        )
      )
      toast.error("Impossible de mettre à jour le label.")
    }
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

  const handleMergeSubmit = async () => {
    if (!estId) {
      toast.error("Impossible de lancer la demande (établissement manquant).")
      return
    }
    const targetSupplier = suppliers.find((s) => s.id === mergeTarget)
    const sourceSuppliers = suppliers.filter((s) => mergeSources.includes(s.id))
    const targetMarketId = targetSupplier?.marketSupplierId
    const sourceMarketIds = sourceSuppliers.map((s) => s.marketSupplierId).filter(Boolean) as string[]

    if (!targetMarketId || !sourceMarketIds.length) {
      toast.error("Sélection invalide pour le regroupement.")
      return
    }

    try {
      await createSupplierMergeRequest({
        target_market_supplier_id: targetMarketId,
        source_market_supplier_ids: sourceMarketIds,
        requesting_establishment_id: estId,
      })
      toast.success(`Regroupement lancé vers ${targetSupplier?.name ?? "fournisseur cible"}`, {
        description: sourceSuppliers.length ? `Sources : ${sourceSuppliers.map((s) => s.name).join(", ")}` : undefined,
      })
      setMergeOpen(false)
      resetMerge()
      refresh()
    } catch {
      toast.error("Impossible de créer la demande de regroupement.")
    }
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
                          triggerClassName="h-20 min-h-[5rem]"
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
                            {supplierLabelOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.label}>
                                {opt.label}
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
