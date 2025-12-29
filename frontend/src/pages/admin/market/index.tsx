import { useMemo, useState } from "react"

import { MarketArticleDetailView } from "./article-detail"
import { MarketSuppliersListView } from "./list"
import { MarketSupplierDetailView } from "./supplier-detail"
import type {
  Establishment,
  MarketArticle,
  MarketMasterArticle,
  MarketSupplier,
  MarketSupplierLabel,
  UserProfile,
} from "./types"

type ViewState =
  | { type: "list" }
  | { type: "supplier"; supplierId: string }
  | { type: "article"; articleId: string }

const suppliersSeed: MarketSupplier[] = [
  {
    id: "sup-1",
    name: "Metro",
    label: "FOOD",
    active: true,
    createdAt: "2024-11-12T09:12:00",
    updatedAt: "2025-01-12T11:10:00",
  },
  {
    id: "sup-2",
    name: "Sysco",
    label: "FOOD",
    active: true,
    createdAt: "2024-10-05T08:40:00",
    updatedAt: "2025-01-08T09:20:00",
  },
  {
    id: "sup-3",
    name: "France Boissons",
    label: "BEVERAGES",
    active: false,
    createdAt: "2024-09-18T10:10:00",
    updatedAt: "2024-12-22T15:55:00",
  },
]

const masterArticlesSeed: MarketMasterArticle[] = [
  {
    id: "ma-1",
    supplierId: "sup-1",
    name: "Tomates grappes",
    unit: "kg",
    unformattedName: "TOMATES GRAPPES CAT 1",
    currentUnitPrice: 2.45,
    isActive: true,
    createdAt: "2024-11-20T10:15:00",
    updatedAt: "2025-01-30T09:30:00",
  },
  {
    id: "ma-2",
    supplierId: "sup-1",
    name: "Salade iceberg",
    unit: "piece",
    unformattedName: "SALADE ICEBERG CAT 1",
    currentUnitPrice: 1.18,
    isActive: true,
    createdAt: "2024-11-22T14:10:00",
    updatedAt: "2025-01-25T08:45:00",
  },
  {
    id: "ma-3",
    supplierId: "sup-2",
    name: "Filet de poulet",
    unit: "kg",
    unformattedName: "FILET POULET FRANCE",
    currentUnitPrice: 8.9,
    isActive: true,
    createdAt: "2024-10-20T10:50:00",
    updatedAt: "2025-01-19T11:05:00",
  },
  {
    id: "ma-4",
    supplierId: "sup-3",
    name: "Cola 33cl",
    unit: "bouteille",
    unformattedName: "COLA 33CL",
    currentUnitPrice: 1.1,
    isActive: false,
    createdAt: "2024-09-25T16:30:00",
    updatedAt: "2024-12-10T09:20:00",
  },
]

const marketArticlesSeed: MarketArticle[] = [
  {
    id: "art-1",
    masterArticleId: "ma-1",
    supplierId: "sup-1",
    date: "2025-01-30T07:20:00",
    unitPrice: 2.45,
    grossUnitPrice: 2.6,
    unit: "kg",
    discounts: 0.05,
    dutiesAndTaxes: 0.02,
    quantity: 15,
    total: 36.75,
    establishmentId: "est-1",
    createdBy: "usr-1",
    invoicePath: "/mock/invoices/inv-1001.pdf",
    invoiceId: "inv-1001",
    isActive: true,
  },
  {
    id: "art-2",
    masterArticleId: "ma-1",
    supplierId: "sup-1",
    date: "2025-01-10T08:05:00",
    unitPrice: 2.32,
    grossUnitPrice: 2.45,
    unit: "kg",
    discounts: 0.04,
    dutiesAndTaxes: 0.02,
    quantity: 12,
    total: 27.84,
    establishmentId: "est-2",
    createdBy: "usr-2",
    invoicePath: "/mock/invoices/inv-0977.pdf",
    invoiceId: "inv-0977",
    isActive: true,
  },
  {
    id: "art-3",
    masterArticleId: "ma-1",
    supplierId: "sup-1",
    date: "2024-12-20T07:40:00",
    unitPrice: 2.18,
    grossUnitPrice: 2.3,
    unit: "kg",
    discounts: 0.03,
    dutiesAndTaxes: 0.02,
    quantity: 10,
    total: 21.8,
    establishmentId: "est-1",
    createdBy: "usr-3",
    invoicePath: null,
    invoiceId: "inv-0912",
    isActive: true,
  },
  {
    id: "art-4",
    masterArticleId: "ma-2",
    supplierId: "sup-1",
    date: "2025-01-25T10:15:00",
    unitPrice: 1.18,
    grossUnitPrice: 1.25,
    unit: "piece",
    discounts: 0,
    dutiesAndTaxes: 0.01,
    quantity: 40,
    total: 47.2,
    establishmentId: "est-2",
    createdBy: "usr-2",
    invoicePath: "/mock/invoices/inv-0992.pdf",
    invoiceId: "inv-0992",
    isActive: true,
  },
  {
    id: "art-5",
    masterArticleId: "ma-3",
    supplierId: "sup-2",
    date: "2025-01-18T09:35:00",
    unitPrice: 8.9,
    grossUnitPrice: 9.3,
    unit: "kg",
    discounts: 0.05,
    dutiesAndTaxes: 0.03,
    quantity: 6,
    total: 53.4,
    establishmentId: "est-3",
    createdBy: "usr-4",
    invoicePath: "/mock/invoices/inv-0950.pdf",
    invoiceId: "inv-0950",
    isActive: true,
  },
  {
    id: "art-6",
    masterArticleId: "ma-4",
    supplierId: "sup-3",
    date: "2024-12-09T11:10:00",
    unitPrice: 1.1,
    grossUnitPrice: 1.2,
    unit: "bouteille",
    discounts: 0.02,
    dutiesAndTaxes: 0.01,
    quantity: 48,
    total: 52.8,
    establishmentId: "est-4",
    createdBy: "usr-5",
    invoicePath: "/mock/invoices/inv-0881.pdf",
    invoiceId: "inv-0881",
    isActive: false,
  },
]

const establishmentsSeed: Establishment[] = [
  { id: "est-1", name: "La Cantine Lumiere", city: "Lyon" },
  { id: "est-2", name: "Brasserie du Port", city: "Marseille" },
  { id: "est-3", name: "Chez Antonio", city: "Nice" },
  { id: "est-4", name: "Atelier Vert", city: "Bordeaux" },
]

const usersSeed: UserProfile[] = [
  { id: "usr-1", name: "Clara Mendes", email: "clara@lacantine.fr" },
  { id: "usr-2", name: "Hugo Perrin", email: "hugo@brasserieduport.fr" },
  { id: "usr-3", name: "Maya Lopez", email: "maya@cafeperle.fr" },
  { id: "usr-4", name: "Nicolas Dubois", email: "nicolas@chezantonio.fr" },
  { id: "usr-5", name: "Louise Armand", email: "louise@ateliervert.fr" },
]

export default function AdminMarketPage() {
  const [suppliers, setSuppliers] = useState<MarketSupplier[]>(suppliersSeed)
  const [masterArticles, setMasterArticles] = useState<MarketMasterArticle[]>(
    masterArticlesSeed
  )
  const [marketArticles] = useState<MarketArticle[]>(marketArticlesSeed)
  const [view, setView] = useState<ViewState>({ type: "list" })

  const supplierById = useMemo(() => {
    return new Map(suppliers.map((supplier) => [supplier.id, supplier]))
  }, [suppliers])

  const selectedSupplier =
    view.type === "supplier"
      ? supplierById.get(view.supplierId) ?? null
      : view.type === "article"
        ? supplierById.get(
            masterArticles.find((article) => article.id === view.articleId)?.supplierId ?? ""
          ) ?? null
        : null

  const selectedArticle =
    view.type === "article"
      ? masterArticles.find((article) => article.id === view.articleId) ?? null
      : null

  const supplierArticles = useMemo(() => {
    if (!selectedSupplier) return []
    return masterArticles.filter((article) => article.supplierId === selectedSupplier.id)
  }, [masterArticles, selectedSupplier])

  const articleEntries = useMemo(() => {
    if (!selectedArticle) return []
    return marketArticles.filter((entry) => entry.masterArticleId === selectedArticle.id)
  }, [marketArticles, selectedArticle])

  const handleUpdateSupplier = (supplierId: string, input: { active: boolean; label: MarketSupplierLabel | null }) => {
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === supplierId
          ? {
              ...supplier,
              active: input.active,
              label: input.label,
              updatedAt: new Date().toISOString(),
            }
          : supplier
      )
    )
  }

  const handleUpdateMasterArticle = (articleId: string, input: { isActive: boolean }) => {
    setMasterArticles((prev) =>
      prev.map((article) =>
        article.id === articleId
          ? {
              ...article,
              isActive: input.isActive,
              updatedAt: new Date().toISOString(),
            }
          : article
      )
    )
  }

  if (view.type === "article" && selectedArticle && selectedSupplier) {
    return (
      <MarketArticleDetailView
        supplier={selectedSupplier}
        masterArticle={selectedArticle}
        articles={articleEntries}
        establishments={establishmentsSeed}
        users={usersSeed}
        onBack={() => setView({ type: "supplier", supplierId: selectedSupplier.id })}
        onUpdateArticle={(input) => handleUpdateMasterArticle(selectedArticle.id, input)}
      />
    )
  }

  if (view.type === "supplier" && selectedSupplier) {
    return (
      <MarketSupplierDetailView
        supplier={selectedSupplier}
        masterArticles={supplierArticles}
        onBack={() => setView({ type: "list" })}
        onUpdateSupplier={(input) => handleUpdateSupplier(selectedSupplier.id, input)}
        onOpenArticle={(articleId) => setView({ type: "article", articleId })}
      />
    )
  }

  return (
    <MarketSuppliersListView
      suppliers={suppliers}
      masterArticles={masterArticles}
      onOpenSupplier={(supplierId) => setView({ type: "supplier", supplierId })}
    />
  )
}
