"use client"

import { useMemo, useState } from "react"
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
import type {
  Mercuriale,
  MercurialeRequest,
  MercurialeSupplier,
  SupplierLabel,
} from "./types"

type SupplierCreateInput = {
  name: string
  label: SupplierLabel
  active: boolean
  marketSupplierId?: string
  mercurialLogoPath?: string
}

type SupplierRow = MercurialeSupplier & {
  mercurialesCount: number
  updatedAt: string | null
}

type MercurialesListViewProps = {
  requests: MercurialeRequest[]
  suppliers: MercurialeSupplier[]
  mercuriales: Mercuriale[]
  onSelectSupplier: (supplierId: string) => void
  onCreateSupplier: (input: SupplierCreateInput) => void
}

const labelOptions: SupplierLabel[] = [
  "FOOD",
  "BEVERAGES",
  "FIXED COSTS",
  "VARIABLE COSTS",
  "OTHER",
]

export function MercurialesListView({
  requests,
  suppliers,
  mercuriales,
  onSelectSupplier,
  onCreateSupplier,
}: MercurialesListViewProps) {
  const supplierRows = useMemo<SupplierRow[]>(() => {
    return suppliers.map((supplier) => {
      const related = mercuriales.filter(
        (row) => row.supplierId === supplier.id
      )
      const updatedAt =
        related
          .map((row) => row.updatedAt)
          .filter(Boolean)
          .sort()
          .reverse()[0] ?? null

      return {
        ...supplier,
        mercurialesCount: related.length,
        updatedAt,
      }
    })
  }, [suppliers, mercuriales])

  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [label, setLabel] = useState<SupplierLabel>("FOOD")
  const [active, setActive] = useState(true)
  const [marketSupplierId, setMarketSupplierId] = useState("")
  const [logoPath, setLogoPath] = useState("")

  const resetForm = () => {
    setName("")
    setLabel("FOOD")
    setActive(true)
    setMarketSupplierId("")
    setLogoPath("")
  }

  const handleCreateSupplier = () => {
    if (!name.trim()) return
    onCreateSupplier({
      name: name.trim(),
      label,
      active,
      marketSupplierId: marketSupplierId.trim() || undefined,
      mercurialLogoPath: logoPath.trim() || undefined,
    })
    resetForm()
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mercuriales</h1>
        <p className="text-sm text-muted-foreground">
          Demandes et fournisseurs de mercuriales.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Demandes</CardTitle>
            <CardDescription>
              Tableau de lecture pour prioriser les prochains fournisseurs.
            </CardDescription>
          </div>
          <span />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Date</TableHead>
                <TableHead className="w-56">Etablissement</TableHead>
                <TableHead>Demande</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {request.createdAt}
                  </TableCell>
                  <TableCell className="font-medium">
                    {request.establishment}
                  </TableCell>
                  <TableCell className="text-sm">{request.message}</TableCell>
                </TableRow>
              ))}
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucune demande.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start gap-3">
            <div className="space-y-1">
              <CardTitle>Fournisseurs mercuriales</CardTitle>
              <CardDescription>Creer ou modifier un fournisseur.</CardDescription>
            </div>
            <div className="ml-auto">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">Nouveau fournisseur</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Nouveau fournisseur</DialogTitle>
                    <DialogDescription>
                      Renseignez les informations principales du fournisseur.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="supplier-name">Nom</Label>
                      <Input
                        id="supplier-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Label</Label>
                      <Select
                        value={label}
                        onValueChange={(value) => setLabel(value as SupplierLabel)}
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
                        value={marketSupplierId}
                        onChange={(event) => setMarketSupplierId(event.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="supplier-logo">Logo path</Label>
                      <Input
                        id="supplier-logo"
                        value={logoPath}
                        onChange={(event) => setLogoPath(event.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Actif</p>
                        <p className="text-xs text-muted-foreground">
                          Activer le fournisseur pour les mercuriales.
                        </p>
                      </div>
                      <Switch checked={active} onCheckedChange={setActive} />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        resetForm()
                        setDialogOpen(false)
                      }}
                    >
                      Annuler
                    </Button>
                    <Button type="button" onClick={handleCreateSupplier}>
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
                <TableHead>Fournisseur</TableHead>
                <TableHead className="w-32">Label</TableHead>
                <TableHead className="w-24">Statut</TableHead>
                <TableHead className="w-24 text-right">Mercuriales</TableHead>
                <TableHead className="w-32 text-right">MAJ</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplierRows.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.label}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.active ? "default" : "secondary"}>
                      {supplier.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {supplier.mercurialesCount}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {supplier.updatedAt ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectSupplier(supplier.id)}
                    >
                      Ouvrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {supplierRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Aucun fournisseur.
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
