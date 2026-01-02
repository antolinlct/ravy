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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import MultipleCombobox from "@/components/ui/multiple_combobox"
import type {
  MarketSupplier,
  MarketSupplierAlias,
  MergeRequestStatus,
  SupplierMergeRequest,
} from "./types"

type MergesListViewProps = {
  requests: SupplierMergeRequest[]
  suppliers: MarketSupplier[]
  aliases: MarketSupplierAlias[]
  ownerEstablishment?: string
  ownerEstablishmentId?: string
  onAcceptRequest: (id: string) => void
  onRefuseRequest: (id: string) => void
  onCreateRequest: (input: {
    sourceSupplierIds: string[]
    targetSupplierId: string
    requestingEstablishmentId?: string | null
  }) => void
  onOpenSupplier: (id: string) => void
}

const statusLabelMap: Record<MergeRequestStatus, string> = {
  pending: "En attente",
  to_confirm: "A confirmer",
  accepted: "Acceptee",
  resolved: "Ignoree",
  refused: "Classee",
}

const statusVariantMap: Partial<Record<MergeRequestStatus, "default" | "secondary">> =
  {
    pending: "secondary",
    to_confirm: "secondary",
    accepted: "default",
    resolved: "secondary",
    refused: "secondary",
  }

export function MergesListView({
  requests,
  suppliers,
  aliases,
  ownerEstablishment,
  ownerEstablishmentId,
  onAcceptRequest,
  onRefuseRequest,
  onCreateRequest,
  onOpenSupplier,
}: MergesListViewProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [createSources, setCreateSources] = useState<string[]>([])
  const [createTarget, setCreateTarget] = useState("")
  const [createEstablishment, setCreateEstablishment] = useState("")

  const supplierById = useMemo(() => {
    return new Map(suppliers.map((supplier) => [supplier.id, supplier]))
  }, [suppliers])

  const aliasCountBySupplier = useMemo(() => {
    const map = new Map<string, number>()
    for (const alias of aliases) {
      map.set(alias.supplierMarketId, (map.get(alias.supplierMarketId) ?? 0) + 1)
    }
    return map
  }, [aliases])

  const sortedSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
    )
  }, [suppliers])

  const supplierItems = useMemo(() => {
    return sortedSuppliers.map((supplier) => ({
      value: supplier.id,
      label: supplier.name,
    }))
  }, [sortedSuppliers])

  const selectedRequest = useMemo(() => {
    if (!selectedRequestId) return null
    return requests.find((request) => request.id === selectedRequestId) ?? null
  }, [requests, selectedRequestId])

  const canCreateRequest =
    createTarget !== "" &&
    createSources.length > 0 &&
    !createSources.includes(createTarget)

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Fusions fournisseurs</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des demandes de fusion et gestion des market suppliers.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Demandes de fusion</CardTitle>
          <CardDescription>
            Accepter ou refuser les demandes utilisateurs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog
            open={detailOpen}
            onOpenChange={(open) => {
              setDetailOpen(open)
              if (!open) {
                setSelectedRequestId(null)
                setConfirmOpen(false)
              }
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Detail de la demande</DialogTitle>
                <DialogDescription>
                  Verifiez les informations avant validation.
                </DialogDescription>
              </DialogHeader>
              {selectedRequest ? (
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedRequest.createdAt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Etablissement</span>
                    <span className="font-medium">
                      {selectedRequest.establishment ?? "-"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-muted-foreground">Sources</span>
                    <span className="text-right font-medium">
                      {selectedRequest.sourceSupplierIds.length > 0
                        ? selectedRequest.sourceSupplierIds
                            .map(
                              (id) => supplierById.get(id)?.name ?? id
                            )
                            .join(", ")
                        : "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cible</span>
                    <span className="font-medium">
                      {supplierById.get(selectedRequest.targetSupplierId)?.name ??
                        "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <Badge
                      variant={statusVariantMap[selectedRequest.status] ?? "secondary"}
                    >
                      {statusLabelMap[selectedRequest.status]}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune demande selectionnee.
                </p>
              )}
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDetailOpen(false)}
                >
                  Fermer
                </Button>
                {selectedRequest && selectedRequest.status === "pending" ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        onRefuseRequest(selectedRequest.id)
                        setDetailOpen(false)
                      }}
                    >
                      Refuser
                    </Button>
                    <Button type="button" onClick={() => setConfirmOpen(true)}>
                      Accepter
                    </Button>
                  </>
                ) : null}
              </DialogFooter>
              <AlertDialog
                open={confirmOpen}
                onOpenChange={(open) => setConfirmOpen(open)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer l acceptation</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action validera la fusion de fournisseurs.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (!selectedRequest) return
                        onAcceptRequest(selectedRequest.id)
                        setConfirmOpen(false)
                        setDetailOpen(false)
                      }}
                    >
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DialogContent>
          </Dialog>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Date</TableHead>
                <TableHead className="w-48">Etablissement</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead className="w-44">Cible</TableHead>
                <TableHead className="w-28">Statut</TableHead>
                <TableHead className="w-28 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => {
                const sourceNames =
                  request.sourceSupplierIds.length > 0
                    ? request.sourceSupplierIds
                        .map((id) => supplierById.get(id)?.name ?? id)
                        .join(", ")
                    : "-"
                const targetName =
                  supplierById.get(request.targetSupplierId)?.name ?? "-"
                return (
                  <TableRow key={request.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {request.createdAt}
                    </TableCell>
                    <TableCell className="font-medium">
                      {request.establishment ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">{sourceNames}</TableCell>
                    <TableCell className="text-sm">{targetName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariantMap[request.status] ?? "secondary"}
                      >
                        {statusLabelMap[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedRequestId(request.id)
                          setDetailOpen(true)
                        }}
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
              <CardTitle>Market suppliers</CardTitle>
              <CardDescription>
                Consultez un fournisseur pour gerer ses alias OCR.
              </CardDescription>
            </div>
            <div className="ml-auto">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">Nouvelle demande</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Nouvelle demande de fusion</DialogTitle>
                    <DialogDescription>
                      Selectionnez les sources et la cible a fusionner.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>
                        {ownerEstablishment
                          ? "Etablissement (padrino)"
                          : "Etablissement (optionnel)"}
                      </Label>
                      <Input
                        value={ownerEstablishment ?? createEstablishment}
                        onChange={(event) =>
                          setCreateEstablishment(event.target.value)
                        }
                        disabled={Boolean(ownerEstablishment)}
                        placeholder="Nom de l'etablissement"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Sources a fusionner</Label>
                      <MultipleCombobox
                        items={supplierItems.filter(
                          (item) => item.value !== createTarget
                        )}
                        value={createSources}
                        onChange={setCreateSources}
                        placeholder="Selectionner des fournisseurs"
                        className="w-full"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Cible finale</Label>
                      <Select
                        value={createTarget}
                        onValueChange={setCreateTarget}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir le fournisseur cible" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierItems
                            .filter((item) => !createSources.includes(item.value))
                            .map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {createSources.includes(createTarget) ? (
                      <p className="text-xs text-destructive">
                        La cible ne peut pas etre dans les sources.
                      </p>
                    ) : null}
                  </div>
                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setCreateOpen(false)
                        setCreateSources([])
                        setCreateTarget("")
                        setCreateEstablishment("")
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      disabled={!canCreateRequest}
                      onClick={() => {
                        onCreateRequest({
                          sourceSupplierIds: createSources,
                          targetSupplierId: createTarget,
                          requestingEstablishmentId: ownerEstablishmentId ?? null,
                        })
                        setCreateOpen(false)
                        setCreateSources([])
                        setCreateTarget("")
                        setCreateEstablishment("")
                      }}
                    >
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
                <TableHead className="w-24">Label</TableHead>
                <TableHead className="w-24">Statut</TableHead>
                <TableHead className="w-24 text-right">Alias</TableHead>
                <TableHead className="w-32 text-right">MAJ</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.label ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={supplier.active ? "default" : "secondary"}>
                      {supplier.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {aliasCountBySupplier.get(supplier.id) ?? 0}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {supplier.updatedAt ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenSupplier(supplier.id)}
                    >
                      Ouvrir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sortedSuppliers.length === 0 ? (
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
