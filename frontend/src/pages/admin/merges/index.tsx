import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { useUserEstablishments } from "@/context/UserEstablishmentsContext"

import { MergesListView } from "./list"
import { MarketSupplierDetailView } from "./supplier-detail"
import {
  createMarketSupplierAlias,
  createMergeRequest,
  deleteMarketSupplierAlias,
  fetchEstablishments,
  fetchMarketSupplierAliases,
  fetchMarketSuppliers,
  fetchMergeRequests,
  mergeSuppliers,
  updateMarketSupplier,
  updateMarketSupplierAlias,
  updateMergeRequest,
} from "./api"
import type {
  MarketSupplier,
  MarketSupplierAlias,
  SupplierMergeRequest,
  SupplierLabel,
} from "./types"

type ViewState = { type: "list" } | { type: "supplier"; supplierId: string }

type SupplierUpdateInput = {
  name: string
  active: boolean
  label?: SupplierLabel | null
}

const nowStamp = () => new Date().toISOString()

const normalizeSourceIds = (value: unknown): string[] => {
  if (!value) return []
  if (Array.isArray(value)) return value.map((item) => String(item))
  if (typeof value === "object") {
    const flattened: unknown[] = []
    Object.values(value as Record<string, unknown>).forEach((entry) => {
      if (Array.isArray(entry)) {
        flattened.push(...entry)
      } else {
        flattened.push(entry)
      }
    })
    return flattened.map((item) => String(item))
  }
  return [String(value)]
}

export default function AdminMergesPage() {
  const userEstablishments = useUserEstablishments()
  const [requests, setRequests] = useState<SupplierMergeRequest[]>([])
  const [suppliers, setSuppliers] = useState<MarketSupplier[]>([])
  const [aliases, setAliases] = useState<MarketSupplierAlias[]>([])
  const [establishmentById, setEstablishmentById] = useState<Map<string, string>>(
    new Map()
  )
  const [view, setView] = useState<ViewState>({ type: "list" })

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const [requestsData, suppliersData, aliasesData, establishmentsData] =
          await Promise.all([
            fetchMergeRequests(),
            fetchMarketSuppliers(),
            fetchMarketSupplierAliases(),
            fetchEstablishments(),
          ])

        if (!active) return

        const establishmentsMap = new Map<string, string>(
          establishmentsData.map((item) => [item.id, item.name ?? "--"])
        )
        setEstablishmentById(establishmentsMap)

        setSuppliers(
          suppliersData.map<MarketSupplier>((supplier) => ({
            id: supplier.id,
            name: supplier.name ?? "Fournisseur",
            active: Boolean(supplier.active),
            label: supplier.label ?? null,
            createdAt: supplier.created_at ?? null,
            updatedAt: supplier.updated_at ?? null,
          }))
        )

        setAliases(
          aliasesData.map<MarketSupplierAlias>((alias) => ({
            id: alias.id,
            supplierMarketId: alias.supplier_market_id ?? "",
            alias: alias.alias ?? "--",
            createdAt: alias.created_at ?? null,
          }))
        )

        setRequests(
          requestsData.map<SupplierMergeRequest>((request) => ({
            id: request.id,
            createdAt: request.created_at ?? nowStamp(),
            status: (request.status ?? "pending") as SupplierMergeRequest["status"],
            sourceSupplierIds: normalizeSourceIds(request.source_market_supplier_ids),
            targetSupplierId: request.target_market_supplier_id ?? "",
            requestingEstablishmentId: request.requesting_establishment_id ?? null,
            establishment: request.requesting_establishment_id
              ? establishmentsMap.get(request.requesting_establishment_id) ?? null
              : null,
          }))
        )
      } catch (error) {
        console.error(error)
        toast.error("Impossible de charger les fusions.")
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

  const ownerEstablishmentId = useMemo(() => {
    const list = userEstablishments?.list ?? []
    return (
      list.find((item) => item.role === "padrino")?.establishmentId ??
      list[0]?.establishmentId ??
      null
    )
  }, [userEstablishments?.list])

  const ownerEstablishmentName = useMemo(() => {
    if (!ownerEstablishmentId) return null
    return establishmentById.get(ownerEstablishmentId) ?? null
  }, [establishmentById, ownerEstablishmentId])

  const selectedSupplier =
    view.type === "supplier"
      ? suppliers.find((supplier) => supplier.id === view.supplierId) ?? null
      : null

  const supplierAliases = useMemo(() => {
    if (!selectedSupplier) return []
    return aliases.filter(
      (alias) => alias.supplierMarketId === selectedSupplier.id
    )
  }, [aliases, selectedSupplier])

  const handleAcceptRequest = async (id: string) => {
    try {
      const updated = await updateMergeRequest(id, { status: "accepted" })
      setRequests((prev) =>
        prev.map((request) =>
          request.id === id
            ? {
                ...request,
                status: (updated.status ?? "accepted") as SupplierMergeRequest["status"],
              }
            : request
        )
      )
      try {
        await mergeSuppliers(id)
        toast.success("Demande acceptee et fusion lancee.")
      } catch (error) {
        console.error(error)
        toast.error("Fusion impossible apres acceptation.")
      }
    } catch (error) {
      console.error(error)
      toast.error("Impossible d accepter la demande.")
    }
  }

  const handleRefuseRequest = async (id: string) => {
    try {
      const updated = await updateMergeRequest(id, { status: "refused" })
      setRequests((prev) =>
        prev.map((request) =>
          request.id === id
            ? {
                ...request,
                status: (updated.status ?? "refused") as SupplierMergeRequest["status"],
              }
            : request
        )
      )
      toast.success("Demande refusee.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de refuser la demande.")
    }
  }

  const handleUpdateSupplier = async (input: SupplierUpdateInput) => {
    if (!selectedSupplier) return
    try {
      const updated = await updateMarketSupplier(selectedSupplier.id, {
        name: input.name,
        active: input.active,
        label: input.label ?? null,
      })
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === selectedSupplier.id
            ? {
                ...supplier,
                name: updated.name ?? input.name,
                active: Boolean(updated.active),
                label: updated.label ?? null,
                updatedAt: updated.updated_at ?? nowStamp(),
              }
            : supplier
        )
      )
      toast.success("Fournisseur mis a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de mettre a jour le fournisseur.")
    }
  }

  const handleCreateAlias = async (aliasValue: string) => {
    if (!selectedSupplier) return
    try {
      const created = await createMarketSupplierAlias({
        supplier_market_id: selectedSupplier.id,
        alias: aliasValue,
      })
      setAliases((prev) => [
        ...prev,
        {
          id: created.id,
          supplierMarketId: created.supplier_market_id ?? selectedSupplier.id,
          alias: created.alias ?? aliasValue,
          createdAt: created.created_at ?? nowStamp(),
        },
      ])
      toast.success("Alias ajoute.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible d ajouter l alias.")
    }
  }

  const handleUpdateAlias = async (id: string, aliasValue: string) => {
    try {
      const updated = await updateMarketSupplierAlias(id, { alias: aliasValue })
      setAliases((prev) =>
        prev.map((alias) =>
          alias.id === id
            ? { ...alias, alias: updated.alias ?? aliasValue }
            : alias
        )
      )
      toast.success("Alias mis a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de modifier l alias.")
    }
  }

  const handleDeleteAlias = async (id: string) => {
    try {
      await deleteMarketSupplierAlias(id)
      setAliases((prev) => prev.filter((alias) => alias.id !== id))
      toast.success("Alias supprime.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de supprimer l alias.")
    }
  }

  if (view.type === "supplier" && selectedSupplier) {
    return (
      <MarketSupplierDetailView
        supplier={selectedSupplier}
        aliases={supplierAliases}
        onBack={() => setView({ type: "list" })}
        onUpdateSupplier={handleUpdateSupplier}
        onCreateAlias={handleCreateAlias}
        onUpdateAlias={handleUpdateAlias}
        onDeleteAlias={handleDeleteAlias}
      />
    )
  }

  return (
    <MergesListView
      requests={requests}
      suppliers={suppliers}
      aliases={aliases}
      ownerEstablishment={ownerEstablishmentName ?? undefined}
      ownerEstablishmentId={ownerEstablishmentId ?? undefined}
      onAcceptRequest={handleAcceptRequest}
      onRefuseRequest={handleRefuseRequest}
      onCreateRequest={async (input) => {
        try {
          const payload = {
            source_market_supplier_ids: { ids: input.sourceSupplierIds },
            target_market_supplier_id: input.targetSupplierId,
            requesting_establishment_id: input.requestingEstablishmentId ?? null,
            status: "pending" as const,
          }
          const created = await createMergeRequest(payload)
          const normalized: SupplierMergeRequest = {
            id: created.id,
            createdAt: created.created_at ?? nowStamp(),
            status: (created.status ?? "pending") as SupplierMergeRequest["status"],
            sourceSupplierIds: normalizeSourceIds(created.source_market_supplier_ids),
            targetSupplierId: created.target_market_supplier_id ?? "",
            requestingEstablishmentId: created.requesting_establishment_id ?? null,
            establishment: created.requesting_establishment_id
              ? establishmentById.get(created.requesting_establishment_id) ?? null
              : null,
          }
          setRequests((prev) => [normalized, ...prev])
          toast.success("Demande creee.")
        } catch (error) {
          console.error(error)
          toast.error("Impossible de creer la demande.")
        }
      }}
      onOpenSupplier={(supplierId) =>
        setView({ type: "supplier", supplierId })
      }
    />
  )
}
