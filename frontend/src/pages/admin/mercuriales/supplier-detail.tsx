"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { Mercuriale, MercurialeSupplier, SupplierLabel } from "./types"

type MercurialeCreateInput = {
  name: string
  description?: string
  active: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

type SupplierUpdateInput = {
  name: string
  label: SupplierLabel
  active: boolean
  marketSupplierId?: string
  mercurialLogoPath?: string
}

type SupplierDetailViewProps = {
  supplier: MercurialeSupplier
  mercuriales: Mercuriale[]
  onBack: () => void
  onSelectMercuriale: (mercurialeId: string) => void
  onCreateMercuriale: (input: MercurialeCreateInput) => void
  onUpdateSupplier: (input: SupplierUpdateInput) => void
}

const labelOptions: SupplierLabel[] = [
  "FOOD",
  "BEVERAGES",
  "FIXED COSTS",
  "VARIABLE COSTS",
  "OTHER",
]

export function MercurialeSupplierDetailView({
  supplier,
  mercuriales,
  onBack,
  onSelectMercuriale,
  onCreateMercuriale,
  onUpdateSupplier,
}: SupplierDetailViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newActive, setNewActive] = useState(true)
  const [newFrom, setNewFrom] = useState("")
  const [newTo, setNewTo] = useState("")

  const [draftName, setDraftName] = useState(supplier.name)
  const [draftLabel, setDraftLabel] = useState<SupplierLabel>(supplier.label)
  const [draftActive, setDraftActive] = useState(supplier.active)
  const [draftMarketId, setDraftMarketId] = useState(
    supplier.marketSupplierId ?? ""
  )
  const [draftLogo, setDraftLogo] = useState(
    supplier.mercurialLogoPath ?? ""
  )

  useEffect(() => {
    setDraftName(supplier.name)
    setDraftLabel(supplier.label)
    setDraftActive(supplier.active)
    setDraftMarketId(supplier.marketSupplierId ?? "")
    setDraftLogo(supplier.mercurialLogoPath ?? "")
  }, [supplier])

  const hasSupplierChanges = useMemo(() => {
    return (
      draftName !== supplier.name ||
      draftLabel !== supplier.label ||
      draftActive !== supplier.active ||
      draftMarketId !== (supplier.marketSupplierId ?? "") ||
      draftLogo !== (supplier.mercurialLogoPath ?? "")
    )
  }, [
    draftName,
    draftLabel,
    draftActive,
    draftMarketId,
    draftLogo,
    supplier,
  ])

  const handleSaveSupplier = () => {
    onUpdateSupplier({
      name: draftName.trim() || supplier.name,
      label: draftLabel,
      active: draftActive,
      marketSupplierId: draftMarketId.trim() || undefined,
      mercurialLogoPath: draftLogo.trim() || undefined,
    })
  }

  const resetSupplier = () => {
    setDraftName(supplier.name)
    setDraftLabel(supplier.label)
    setDraftActive(supplier.active)
    setDraftMarketId(supplier.marketSupplierId ?? "")
    setDraftLogo(supplier.mercurialLogoPath ?? "")
  }

  const handleCreateMercuriale = () => {
    if (!newName.trim()) return
    onCreateMercuriale({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      active: newActive,
      effectiveFrom: newFrom || undefined,
      effectiveTo: newTo || undefined,
    })
    setNewName("")
    setNewDescription("")
    setNewActive(true)
    setNewFrom("")
    setNewTo("")
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-semibold">{supplier.name}</h1>
          <p className="text-sm text-muted-foreground">
            Parametres et mercuriales associees.
          </p>
        </div>
        <Badge variant={supplier.active ? "default" : "secondary"}>
          {supplier.active ? "Actif" : "Inactif"}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Parametres fournisseur</CardTitle>
          <CardDescription>
            Mettre a jour les informations generales du fournisseur.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="supplier-name">Nom</Label>
            <Input
              id="supplier-name"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Label</Label>
            <Select
              value={draftLabel}
              onValueChange={(value) => setDraftLabel(value as SupplierLabel)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un label" />
              </SelectTrigger>
              <SelectContent>
                {labelOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supplier-market-id">Market supplier id</Label>
            <Input
              id="supplier-market-id"
              value={draftMarketId}
              onChange={(event) => setDraftMarketId(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="supplier-logo">Logo path</Label>
            <Input
              id="supplier-logo"
              value={draftLogo}
              onChange={(event) => setDraftLogo(event.target.value)}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Actif</p>
              <p className="text-xs text-muted-foreground">
                Activer le fournisseur pour les mercuriales.
              </p>
            </div>
            <Switch checked={draftActive} onCheckedChange={setDraftActive} />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <Button
              type="button"
              onClick={handleSaveSupplier}
              disabled={!hasSupplierChanges}
            >
              Enregistrer
            </Button>
            {hasSupplierChanges ? (
              <Button type="button" variant="ghost" onClick={resetSupplier}>
                Annuler
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <div className="space-y-1">
              <CardTitle>Mercuriales</CardTitle>
              <CardDescription>
                Gestion des periodes pour ce fournisseur.
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">Nouvelle mercuriale</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouvelle mercuriale</DialogTitle>
                    <DialogDescription>
                      Renseignez les informations principales de la mercuriale.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="merc-name">Nom</Label>
                      <Input
                        id="merc-name"
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="merc-desc">Description</Label>
                      <Textarea
                        id="merc-desc"
                        value={newDescription}
                        onChange={(event) => setNewDescription(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="merc-from">Debut</Label>
                        <Input
                          id="merc-from"
                          type="date"
                          value={newFrom}
                          onChange={(event) => setNewFrom(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="merc-to">Fin</Label>
                        <Input
                          id="merc-to"
                          type="date"
                          value={newTo}
                          onChange={(event) => setNewTo(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Active</p>
                        <p className="text-xs text-muted-foreground">
                          Active la periode pour les clients.
                        </p>
                      </div>
                      <Switch checked={newActive} onCheckedChange={setNewActive} />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="button" onClick={handleCreateMercuriale}>
                      Creer
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="w-56">Periode</TableHead>
                <TableHead className="w-24">Statut</TableHead>
                <TableHead className="w-28 text-right">MAJ</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mercuriales.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.effectiveFrom && row.effectiveTo
                      ? `${row.effectiveFrom} -> ${row.effectiveTo}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.active ? "default" : "secondary"}>
                      {row.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {row.updatedAt ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectMercuriale(row.id)}
                    >
                      Ouvrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mercuriales.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucune mercuriale.
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
