"use client"

import { useMemo, useState } from "react"
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
import type {
  MarketSupplier,
  MarketSupplierAlias,
  SupplierLabel,
} from "./types"

type SupplierUpdateInput = {
  name: string
  active: boolean
  label?: SupplierLabel | null
}

type SupplierDetailViewProps = {
  supplier: MarketSupplier
  aliases: MarketSupplierAlias[]
  onBack: () => void
  onUpdateSupplier: (input: SupplierUpdateInput) => void
  onCreateAlias: (alias: string) => void
  onUpdateAlias: (id: string, alias: string) => void
  onDeleteAlias: (id: string) => void
}

const labelOptions: SupplierLabel[] = [
  "FOOD",
  "BEVERAGES",
  "FIXED COSTS",
  "VARIABLE COSTS",
  "OTHER",
]

export function MarketSupplierDetailView({
  supplier,
  aliases,
  onBack,
  onUpdateSupplier,
  onCreateAlias,
  onUpdateAlias,
  onDeleteAlias,
}: SupplierDetailViewProps) {
  const [draftName, setDraftName] = useState(supplier.name)
  const [draftLabel, setDraftLabel] = useState<SupplierLabel | undefined>(
    supplier.label ?? undefined
  )
  const [draftActive, setDraftActive] = useState(supplier.active)

  const [aliasDialogOpen, setAliasDialogOpen] = useState(false)
  const [newAlias, setNewAlias] = useState("")

  const [aliasEditOpen, setAliasEditOpen] = useState(false)
  const [aliasEditId, setAliasEditId] = useState<string | null>(null)
  const [aliasEditValue, setAliasEditValue] = useState("")

  const [aliasDeleteOpen, setAliasDeleteOpen] = useState(false)
  const [aliasDeleteId, setAliasDeleteId] = useState<string | null>(null)

  const sortedAliases = useMemo(() => {
    return [...aliases].sort((a, b) =>
      a.alias.localeCompare(b.alias, "fr", { sensitivity: "base" })
    )
  }, [aliases])

  const hasChanges =
    draftName !== supplier.name ||
    draftActive !== supplier.active ||
    (draftLabel ?? null) !== (supplier.label ?? null)

  const handleSaveSupplier = () => {
    onUpdateSupplier({
      name: draftName.trim() || supplier.name,
      active: draftActive,
      label: draftLabel ?? null,
    })
  }

  const handleResetSupplier = () => {
    setDraftName(supplier.name)
    setDraftLabel(supplier.label ?? undefined)
    setDraftActive(supplier.active)
  }

  const handleCreateAlias = () => {
    if (!newAlias.trim()) return
    onCreateAlias(newAlias.trim())
    setNewAlias("")
    setAliasDialogOpen(false)
  }

  const handleOpenAliasEdit = (alias: MarketSupplierAlias) => {
    setAliasEditId(alias.id)
    setAliasEditValue(alias.alias)
    setAliasEditOpen(true)
  }

  const handleSaveAliasEdit = () => {
    if (!aliasEditId || !aliasEditValue.trim()) return
    onUpdateAlias(aliasEditId, aliasEditValue.trim())
    setAliasEditOpen(false)
  }

  const handleConfirmAliasDelete = () => {
    if (!aliasDeleteId) return
    onDeleteAlias(aliasDeleteId)
    setAliasDeleteId(null)
    setAliasDeleteOpen(false)
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
            Parametres du market supplier et gestion des alias OCR.
          </p>
        </div>
        <Badge variant={supplier.active ? "default" : "secondary"}>
          {supplier.active ? "Actif" : "Inactif"}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Informations fournisseur</CardTitle>
          <CardDescription>Modifier le market supplier.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="grid gap-2 md:col-span-2">
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
          <div className="flex items-center justify-between rounded-md border px-3 py-2 md:col-span-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Actif</p>
              <p className="text-xs text-muted-foreground">
                Activer le fournisseur pour l OCR.
              </p>
            </div>
            <Switch checked={draftActive} onCheckedChange={setDraftActive} />
          </div>
          <div className="flex flex-wrap items-center gap-2 md:col-span-3">
            <Button
              type="button"
              onClick={handleSaveSupplier}
              disabled={!hasChanges}
            >
              Enregistrer
            </Button>
            {hasChanges ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleResetSupplier}
              >
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
              <CardTitle>Alias fournisseur</CardTitle>
              <CardDescription>
                Ajouter ou corriger les alias OCR.
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Dialog open={aliasDialogOpen} onOpenChange={setAliasDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    Nouvel alias
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouvel alias</DialogTitle>
                    <DialogDescription>
                      Ajoutez un alias pour ameliorer l OCR.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2">
                    <Label htmlFor="alias-value">Alias</Label>
                    <Input
                      id="alias-value"
                      value={newAlias}
                      onChange={(event) => setNewAlias(event.target.value)}
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setAliasDialogOpen(false)}
                    >
                      Annuler
                    </Button>
                    <Button type="button" onClick={handleCreateAlias}>
                      Ajouter
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <Dialog open={aliasEditOpen} onOpenChange={setAliasEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier l alias</DialogTitle>
              <DialogDescription>
                Mettez a jour la valeur alias.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="alias-edit-value">Alias</Label>
              <Input
                id="alias-edit-value"
                value={aliasEditValue}
                onChange={(event) => setAliasEditValue(event.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAliasEditOpen(false)}
              >
                Annuler
              </Button>
              <Button type="button" onClick={handleSaveAliasEdit}>
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <AlertDialog
          open={aliasDeleteOpen}
          onOpenChange={(open) => {
            setAliasDeleteOpen(open)
            if (!open) {
              setAliasDeleteId(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l alias</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est definitive. L alias sera supprime.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmAliasDelete}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alias</TableHead>
                <TableHead className="w-32">Cree le</TableHead>
                <TableHead className="w-32 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAliases.map((alias) => (
                <TableRow key={alias.id}>
                  <TableCell className="font-medium">{alias.alias}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {alias.createdAt ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAliasEdit(alias)}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAliasDeleteId(alias.id)
                          setAliasDeleteOpen(true)
                        }}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {sortedAliases.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun alias.
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
