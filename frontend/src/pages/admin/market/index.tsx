import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { MarketArticleDetailView } from "./article-detail"
import { MarketSuppliersListView } from "./list"
import { MarketSupplierDetailView } from "./supplier-detail"
import {
  fetchEstablishments,
  fetchMarketArticlesByMaster,
  fetchMarketMasterArticles,
  fetchMarketSuppliers,
  fetchUserProfiles,
  updateMarketMasterArticle,
  updateMarketSupplier,
} from "./api"
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

const nowStamp = () => new Date().toISOString()

const toNumber = (value?: number | string | null) => {
  if (value === null || value === undefined) return null
  const numeric = typeof value === "string" ? Number(value) : value
  return Number.isFinite(numeric) ? numeric : null
}

const extractCity = (address?: string | null) => {
  if (!address) return "--"
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : address
}

export default function AdminMarketPage() {
  const [suppliers, setSuppliers] = useState<MarketSupplier[]>([])
  const [masterArticles, setMasterArticles] = useState<MarketMasterArticle[]>([])
  const [marketArticles, setMarketArticles] = useState<MarketArticle[]>([])
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [view, setView] = useState<ViewState>({ type: "list" })

  useEffect(() => {
    let active = true

    const loadBase = async () => {
      try {
        const [suppliersData, masterArticlesData, establishmentsData, usersData] =
          await Promise.all([
            fetchMarketSuppliers(),
            fetchMarketMasterArticles(),
            fetchEstablishments(),
            fetchUserProfiles(),
          ])

        if (!active) return

        setSuppliers(
          suppliersData.map<MarketSupplier>((supplier) => ({
            id: supplier.id,
            name: supplier.name ?? "Fournisseur",
            label: supplier.label ?? null,
            active: Boolean(supplier.active),
            createdAt: supplier.created_at ?? nowStamp(),
            updatedAt: supplier.updated_at ?? null,
          }))
        )
        setMasterArticles(
          masterArticlesData.map<MarketMasterArticle>((article) => ({
            id: article.id,
            supplierId: article.market_supplier_id ?? "",
            name: article.name ?? "Article",
            unit: article.unit ?? null,
            unformattedName: article.unformatted_name ?? null,
            currentUnitPrice: toNumber(article.current_unit_price),
            isActive: Boolean(article.is_active),
            createdAt: article.created_at ?? nowStamp(),
            updatedAt: article.updated_at ?? null,
          }))
        )
        setEstablishments(
          establishmentsData.map<Establishment>((establishment) => ({
            id: establishment.id,
            name: establishment.name ?? "Etablissement",
            city: extractCity(establishment.full_adresse),
          }))
        )
        setUsers(
          usersData.map<UserProfile>((user) => {
            const nameParts = [user.first_name, user.last_name].filter(Boolean)
            return {
              id: user.id,
              name: nameParts.length ? nameParts.join(" ") : "Utilisateur",
              email: user.email ?? "--",
            }
          })
        )
      } catch (error) {
        console.error(error)
        toast.error("Impossible de charger les donnees marche.")
      }
    }

    loadBase()

    return () => {
      active = false
    }
  }, [])

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

  useEffect(() => {
    let active = true

    const loadArticles = async (masterId: string) => {
      try {
        const data = await fetchMarketArticlesByMaster(masterId)
        if (!active) return
        setMarketArticles(
          data.map<MarketArticle>((entry) => ({
            id: entry.id,
            masterArticleId: entry.market_master_article_id ?? "",
            supplierId: entry.market_supplier_id ?? "",
            date: entry.date ?? "",
            unitPrice: toNumber(entry.unit_price),
            grossUnitPrice: toNumber(entry.gross_unit_price),
            unit: entry.unit ?? null,
            discounts: toNumber(entry.discounts),
            dutiesAndTaxes: toNumber(entry.duties_and_taxes),
            quantity: toNumber(entry.quantity),
            total: toNumber(entry.total),
            establishmentId: entry.establishment_id ?? null,
            createdBy: entry.created_by ?? null,
            invoicePath: entry.invoice_path ?? null,
            invoiceId: entry.invoice_id ?? null,
            isActive: entry.is_active !== null ? Boolean(entry.is_active) : true,
          }))
        )
      } catch (error) {
        console.error(error)
        toast.error("Impossible de charger les articles marche.")
        setMarketArticles([])
      }
    }

    if (view.type === "article") {
      loadArticles(view.articleId)
    } else {
      setMarketArticles([])
    }

    return () => {
      active = false
    }
  }, [view])

  const handleUpdateSupplier = async (
    supplierId: string,
    input: { active: boolean; label: MarketSupplierLabel | null }
  ) => {
    try {
      const updated = await updateMarketSupplier(supplierId, {
        active: input.active,
        label: input.label,
      })
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === supplierId
            ? {
                ...supplier,
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

  const handleUpdateMasterArticle = async (
    articleId: string,
    input: { isActive: boolean }
  ) => {
    try {
      const updated = await updateMarketMasterArticle(articleId, {
        is_active: input.isActive,
      })
      setMasterArticles((prev) =>
        prev.map((article) =>
          article.id === articleId
            ? {
                ...article,
                isActive: Boolean(updated.is_active),
                updatedAt: updated.updated_at ?? nowStamp(),
              }
            : article
        )
      )
      toast.success("Article mis a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de mettre a jour l article.")
    }
  }

  if (view.type === "article" && selectedArticle && selectedSupplier) {
    return (
      <MarketArticleDetailView
        supplier={selectedSupplier}
        masterArticle={selectedArticle}
        articles={articleEntries}
        establishments={establishments}
        users={users}
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
