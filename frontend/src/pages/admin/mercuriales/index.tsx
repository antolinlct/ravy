import { useMemo, useState } from "react"
import { MercurialeDetailView } from "./mercuriale-detail"
import { MercurialesListView } from "./list"
import { MercurialeSupplierDetailView } from "./supplier-detail"
import type {
  Mercuriale,
  MercurialeArticle,
  MercurialeMasterArticle,
  MercurialeRequest,
  MercurialeSupplier,
  SupplierLabel,
} from "./types"

type ViewState =
  | { type: "list" }
  | { type: "supplier"; supplierId: string }
  | { type: "mercuriale"; supplierId: string; mercurialeId: string }

type SupplierCreateInput = {
  name: string
  label: SupplierLabel
  active: boolean
  marketSupplierId?: string
  mercurialLogoPath?: string
}

type SupplierUpdateInput = {
  name: string
  label: SupplierLabel
  active: boolean
  marketSupplierId?: string
  mercurialLogoPath?: string
}

type MercurialeCreateInput = {
  name: string
  description?: string
  active: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

type MercurialeUpdateInput = {
  name: string
  description?: string
  active: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

type MasterArticleCreateInput = {
  name: string
  unit: string
  vatRate: number
  category: string
  subcategory: string
  raceName?: string
  description?: string
  active: boolean
}

type MercurialeArticleCreateInput = {
  masterArticleId: string
  priceStandard?: number
  pricePlus?: number
  pricePremium?: number
  variation?: number
  active: boolean
}

type MasterArticleUpdateInput = MasterArticleCreateInput
type MercurialeArticleUpdateInput = MercurialeArticleCreateInput

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`

const nowStamp = () => new Date().toISOString().slice(0, 10)

const initialRequests: MercurialeRequest[] = [
  {
    id: "req-1",
    createdAt: "2025-01-12",
    establishment: "Le Bistrot Marais",
    message: "Fournisseur: Metro. Produits: saumon frais, citron jaune.",
  },
  {
    id: "req-2",
    createdAt: "2025-01-18",
    establishment: "Casa Napoli",
    message: "Fournisseur: Transgourmet. Produits: mozzarella, farine 00.",
  },
  {
    id: "req-3",
    createdAt: "2025-01-22",
    establishment: "Brasserie du Parc",
    message: "Fournisseur: France Boissons. Produits: biere pression.",
  },
]

const initialSuppliers: MercurialeSupplier[] = [
  {
    id: "sup-1",
    name: "Metro",
    label: "FOOD",
    active: true,
    marketSupplierId: "metro-001",
    mercurialLogoPath: "/assets/mercus/metro.svg",
  },
  {
    id: "sup-2",
    name: "Transgourmet",
    label: "FOOD",
    active: true,
    marketSupplierId: "transgourmet-002",
    mercurialLogoPath: "/assets/mercus/transgourmet.svg",
  },
  {
    id: "sup-3",
    name: "France Boissons",
    label: "BEVERAGES",
    active: false,
    marketSupplierId: "france-boissons-003",
    mercurialLogoPath: "/assets/mercus/france-boissons.svg",
  },
]

const initialMercuriales: Mercuriale[] = [
  {
    id: "merc-1",
    supplierId: "sup-1",
    name: "Mercuriale hiver",
    description: "Liste hiver, mise a jour hebdomadaire.",
    active: true,
    effectiveFrom: "2025-01-01",
    effectiveTo: "2025-03-31",
    updatedAt: "2025-02-03",
  },
  {
    id: "merc-2",
    supplierId: "sup-1",
    name: "Mercuriale printemps",
    description: "Transition printemps.",
    active: false,
    effectiveFrom: "2025-04-01",
    effectiveTo: "2025-06-30",
    updatedAt: "2025-03-15",
  },
  {
    id: "merc-3",
    supplierId: "sup-2",
    name: "Mercuriale Q1",
    description: "Standard Q1.",
    active: true,
    effectiveFrom: "2025-01-05",
    effectiveTo: "2025-03-29",
    updatedAt: "2025-02-10",
  },
  {
    id: "merc-4",
    supplierId: "sup-3",
    name: "Mercuriale boissons",
    description: "Tarifs boissons.",
    active: false,
    effectiveFrom: "2024-11-01",
    effectiveTo: "2024-12-31",
    updatedAt: "2024-12-16",
  },
]

const initialMasterArticles: MercurialeMasterArticle[] = [
  {
    id: "ma-1",
    supplierId: "sup-1",
    name: "Saumon frais",
    unit: "kg",
    vatRate: 5.5,
    category: "Poissons",
    subcategory: "Frais",
    active: true,
  },
  {
    id: "ma-2",
    supplierId: "sup-1",
    name: "Citron jaune",
    unit: "kg",
    vatRate: 5.5,
    category: "Fruits",
    subcategory: "Agrumes",
    active: true,
  },
  {
    id: "ma-3",
    supplierId: "sup-2",
    name: "Mozzarella",
    unit: "kg",
    vatRate: 5.5,
    category: "Cremerie",
    subcategory: "Fromages",
    active: true,
  },
  {
    id: "ma-4",
    supplierId: "sup-2",
    name: "Farine 00",
    unit: "kg",
    vatRate: 5.5,
    category: "Epicerie",
    subcategory: "Boulangerie",
    active: true,
  },
  {
    id: "ma-5",
    supplierId: "sup-3",
    name: "Biere pression",
    unit: "L",
    vatRate: 20,
    category: "Boissons",
    subcategory: "Biere",
    active: true,
  },
]

const initialArticles: MercurialeArticle[] = [
  {
    id: "art-1",
    mercurialeId: "merc-1",
    masterArticleId: "ma-1",
    priceStandard: 19.5,
    pricePlus: 18.9,
    pricePremium: 18.3,
    variation: 0.04,
    active: true,
  },
  {
    id: "art-2",
    mercurialeId: "merc-1",
    masterArticleId: "ma-2",
    priceStandard: 2.4,
    pricePlus: 2.3,
    pricePremium: 2.1,
    variation: -0.02,
    active: true,
  },
  {
    id: "art-3",
    mercurialeId: "merc-3",
    masterArticleId: "ma-3",
    priceStandard: 7.9,
    pricePlus: 7.4,
    pricePremium: 7.1,
    variation: 0.01,
    active: true,
  },
  {
    id: "art-4",
    mercurialeId: "merc-3",
    masterArticleId: "ma-4",
    priceStandard: 1.2,
    pricePlus: 1.1,
    pricePremium: 1.05,
    variation: -0.03,
    active: true,
  },
]

export default function AdminMercurialesPage() {
  const [requests] = useState(initialRequests)
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [mercuriales, setMercuriales] = useState(initialMercuriales)
  const [masterArticles, setMasterArticles] = useState(initialMasterArticles)
  const [articles, setArticles] = useState(initialArticles)
  const [view, setView] = useState<ViewState>({ type: "list" })

  const selectedSupplierId =
    view.type === "supplier" || view.type === "mercuriale"
      ? view.supplierId
      : null
  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId) return null
    return suppliers.find((supplier) => supplier.id === selectedSupplierId) ?? null
  }, [selectedSupplierId, suppliers])

  const selectedMercuriale =
    view.type === "mercuriale"
      ? mercuriales.find((item) => item.id === view.mercurialeId) ?? null
      : null

  const supplierMercuriales = useMemo(() => {
    if (!selectedSupplier) return []
    return mercuriales.filter((row) => row.supplierId === selectedSupplier.id)
  }, [mercuriales, selectedSupplier])

  const supplierMasterArticles = useMemo(() => {
    if (!selectedSupplier) return []
    return masterArticles.filter(
      (row) => row.supplierId === selectedSupplier.id
    )
  }, [masterArticles, selectedSupplier])

  const mercurialeArticles = useMemo(() => {
    if (!selectedMercuriale) return []
    return articles.filter(
      (row) => row.mercurialeId === selectedMercuriale.id
    )
  }, [articles, selectedMercuriale])

  const handleCreateSupplier = (input: SupplierCreateInput) => {
    setSuppliers((prev) => [
      ...prev,
      {
        id: createId("sup"),
        name: input.name,
        label: input.label,
        active: input.active,
        marketSupplierId: input.marketSupplierId ?? null,
        mercurialLogoPath: input.mercurialLogoPath ?? null,
      },
    ])
  }

  const handleUpdateSupplier = (input: SupplierUpdateInput) => {
    if (!selectedSupplier) return
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === selectedSupplier.id
          ? {
              ...supplier,
              name: input.name,
              label: input.label,
              active: input.active,
              marketSupplierId: input.marketSupplierId ?? null,
              mercurialLogoPath: input.mercurialLogoPath ?? null,
            }
          : supplier
      )
    )
  }

  const handleCreateMercuriale = (input: MercurialeCreateInput) => {
    if (!selectedSupplier) return
    setMercuriales((prev) => [
      ...prev,
      {
        id: createId("merc"),
        supplierId: selectedSupplier.id,
        name: input.name,
        description: input.description ?? null,
        active: input.active,
        effectiveFrom: input.effectiveFrom ?? null,
        effectiveTo: input.effectiveTo ?? null,
        updatedAt: nowStamp(),
      },
    ])
  }

  const handleUpdateMercuriale = (input: MercurialeUpdateInput) => {
    if (!selectedMercuriale) return
    setMercuriales((prev) =>
      prev.map((item) =>
        item.id === selectedMercuriale.id
          ? {
              ...item,
              name: input.name,
              description: input.description ?? null,
              active: input.active,
              effectiveFrom: input.effectiveFrom ?? null,
              effectiveTo: input.effectiveTo ?? null,
              updatedAt: nowStamp(),
            }
          : item
      )
    )
  }

  const handleCreateMasterArticle = (input: MasterArticleCreateInput) => {
    if (!selectedSupplier) return
    setMasterArticles((prev) => [
      ...prev,
      {
        id: createId("ma"),
        supplierId: selectedSupplier.id,
        name: input.name,
        unit: input.unit,
        vatRate: input.vatRate,
        category: input.category,
        subcategory: input.subcategory,
        raceName: input.raceName ?? null,
        description: input.description ?? null,
        active: input.active,
      },
    ])
  }

  const handleUpdateMasterArticle = (
    id: string,
    input: MasterArticleUpdateInput
  ) => {
    setMasterArticles((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              name: input.name,
              unit: input.unit,
              vatRate: input.vatRate,
              category: input.category,
              subcategory: input.subcategory,
              raceName: input.raceName ?? null,
              description: input.description ?? null,
              active: input.active,
            }
          : row
      )
    )
  }

  const handleDeleteMasterArticle = (id: string) => {
    setMasterArticles((prev) => prev.filter((row) => row.id !== id))
    setArticles((prev) => prev.filter((row) => row.masterArticleId !== id))
  }

  const handleCreateArticle = (input: MercurialeArticleCreateInput) => {
    if (!selectedMercuriale) return
    setArticles((prev) => [
      ...prev,
      {
        id: createId("art"),
        mercurialeId: selectedMercuriale.id,
        masterArticleId: input.masterArticleId,
        priceStandard: input.priceStandard ?? null,
        pricePlus: input.pricePlus ?? null,
        pricePremium: input.pricePremium ?? null,
        variation: input.variation ?? null,
        active: input.active,
      },
    ])
  }

  const handleUpdateArticle = (
    id: string,
    input: MercurialeArticleUpdateInput
  ) => {
    setArticles((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              masterArticleId: input.masterArticleId,
              priceStandard: input.priceStandard ?? null,
              pricePlus: input.pricePlus ?? null,
              pricePremium: input.pricePremium ?? null,
              variation: input.variation ?? null,
              active: input.active,
            }
          : row
      )
    )
  }

  const handleRemoveArticle = (articleId: string) => {
    setArticles((prev) => prev.filter((item) => item.id !== articleId))
  }

  if (view.type === "list" || !selectedSupplier) {
    return (
      <MercurialesListView
        requests={requests}
        suppliers={suppliers}
        mercuriales={mercuriales}
        onCreateSupplier={handleCreateSupplier}
        onSelectSupplier={(supplierId) =>
          setView({ type: "supplier", supplierId })
        }
      />
    )
  }

  if (view.type === "supplier") {
    return (
      <MercurialeSupplierDetailView
        supplier={selectedSupplier}
        mercuriales={supplierMercuriales}
        onBack={() => setView({ type: "list" })}
        onSelectMercuriale={(mercurialeId) =>
          setView({
            type: "mercuriale",
            supplierId: selectedSupplier.id,
            mercurialeId,
          })
        }
        onCreateMercuriale={handleCreateMercuriale}
        onUpdateSupplier={handleUpdateSupplier}
      />
    )
  }

  if (!selectedMercuriale) {
    return (
      <MercurialeSupplierDetailView
        supplier={selectedSupplier}
        mercuriales={supplierMercuriales}
        onBack={() => setView({ type: "list" })}
        onSelectMercuriale={(mercurialeId) =>
          setView({
            type: "mercuriale",
            supplierId: selectedSupplier.id,
            mercurialeId,
          })
        }
        onCreateMercuriale={handleCreateMercuriale}
        onUpdateSupplier={handleUpdateSupplier}
      />
    )
  }

  return (
    <MercurialeDetailView
      supplier={selectedSupplier}
      mercuriale={selectedMercuriale}
      supplierMercuriales={supplierMercuriales}
      allArticles={articles}
      masterArticles={supplierMasterArticles}
      articles={mercurialeArticles}
      onBack={() =>
        setView({ type: "supplier", supplierId: selectedSupplier.id })
      }
      onUpdateMercuriale={handleUpdateMercuriale}
      onCreateMasterArticle={handleCreateMasterArticle}
      onUpdateMasterArticle={handleUpdateMasterArticle}
      onDeleteMasterArticle={handleDeleteMasterArticle}
      onCreateArticle={handleCreateArticle}
      onUpdateArticle={handleUpdateArticle}
      onRemoveArticle={handleRemoveArticle}
    />
  )
}
