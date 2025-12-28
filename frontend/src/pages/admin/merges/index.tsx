import { useMemo, useState } from "react"
import { MergesListView } from "./list"
import { MarketSupplierDetailView } from "./supplier-detail"
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

const nowStamp = () => new Date().toISOString().slice(0, 10)

const initialRequests: SupplierMergeRequest[] = [
  {
    id: "merge-1",
    createdAt: "2025-01-06",
    status: "pending",
    sourceSupplierIds: ["sup-1", "sup-4"],
    targetSupplierId: "sup-2",
    establishment: "La Cantine Lumiere",
  },
  {
    id: "merge-2",
    createdAt: "2025-01-15",
    status: "pending",
    sourceSupplierIds: ["sup-3"],
    targetSupplierId: "sup-1",
    establishment: "Chez Antonio",
  },
  {
    id: "merge-3",
    createdAt: "2024-12-22",
    status: "dismissed",
    sourceSupplierIds: ["sup-5"],
    targetSupplierId: "sup-2",
    establishment: "Brasserie du Port",
  },
]

const initialSuppliers: MarketSupplier[] = [
  {
    id: "sup-1",
    name: "Metro",
    active: true,
    label: "FOOD",
    updatedAt: "2025-01-18",
  },
  {
    id: "sup-2",
    name: "Transgourmet",
    active: true,
    label: "FOOD",
    updatedAt: "2025-01-20",
  },
  {
    id: "sup-3",
    name: "France Boissons",
    active: false,
    label: "BEVERAGES",
    updatedAt: "2024-12-10",
  },
  {
    id: "sup-4",
    name: "Sysco",
    active: true,
    label: "FOOD",
    updatedAt: "2025-01-08",
  },
  {
    id: "sup-5",
    name: "Pomona",
    active: true,
    label: "FOOD",
    updatedAt: "2025-01-12",
  },
]

const initialAliases: MarketSupplierAlias[] = [
  {
    id: "alias-1",
    supplierMarketId: "sup-1",
    alias: "Metro Cash & Carry",
    createdAt: "2024-11-30",
  },
  {
    id: "alias-2",
    supplierMarketId: "sup-1",
    alias: "METRO",
    createdAt: "2024-12-01",
  },
  {
    id: "alias-3",
    supplierMarketId: "sup-2",
    alias: "TG",
    createdAt: "2024-12-05",
  },
  {
    id: "alias-4",
    supplierMarketId: "sup-3",
    alias: "FranceBoissons",
    createdAt: "2024-10-14",
  },
]

export default function AdminMergesPage() {
  const [requests, setRequests] = useState(initialRequests)
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [aliases, setAliases] = useState(initialAliases)
  const [view, setView] = useState<ViewState>({ type: "list" })

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

  const handleAcceptRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "accepted" } : request
      )
    )
  }

  const handleRefuseRequest = (id: string) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: "dismissed" } : request
      )
    )
  }

  const handleUpdateSupplier = (input: SupplierUpdateInput) => {
    if (!selectedSupplier) return
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === selectedSupplier.id
          ? {
              ...supplier,
              name: input.name,
              active: input.active,
              label: input.label ?? null,
              updatedAt: nowStamp(),
            }
          : supplier
      )
    )
  }

  const handleCreateAlias = (aliasValue: string) => {
    if (!selectedSupplier) return
    setAliases((prev) => [
      ...prev,
      {
        id: `alias-${Math.random().toString(36).slice(2, 9)}`,
        supplierMarketId: selectedSupplier.id,
        alias: aliasValue,
        createdAt: nowStamp(),
      },
    ])
  }

  const handleUpdateAlias = (id: string, aliasValue: string) => {
    setAliases((prev) =>
      prev.map((alias) =>
        alias.id === id ? { ...alias, alias: aliasValue } : alias
      )
    )
  }

  const handleDeleteAlias = (id: string) => {
    setAliases((prev) => prev.filter((alias) => alias.id !== id))
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
      ownerEstablishment="Etablissement demo"
      onAcceptRequest={handleAcceptRequest}
      onRefuseRequest={handleRefuseRequest}
      onCreateRequest={(input) => {
        setRequests((prev) => [
          {
            id: `merge-${Math.random().toString(36).slice(2, 9)}`,
            createdAt: nowStamp(),
            status: "pending",
            sourceSupplierIds: input.sourceSupplierIds,
            targetSupplierId: input.targetSupplierId,
            establishment: input.establishment ?? null,
          },
          ...prev,
        ])
      }}
      onOpenSupplier={(supplierId) =>
        setView({ type: "supplier", supplierId })
      }
    />
  )
}
