import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { MercurialeDetailView } from "./mercuriale-detail"
import { MercurialesListView } from "./list"
import { MercurialeSupplierDetailView } from "./supplier-detail"
import {
  createMercuriale,
  createMercurialeArticle,
  createMercurialeMasterArticle,
  createMercurialeSupplier,
  deleteMercurialeArticle,
  deleteMercurialeMasterArticle,
  fetchEstablishments,
  fetchMercurialeArticles,
  fetchMercurialeCategories,
  fetchMercurialeMasterArticles,
  fetchMercurialeRequests,
  fetchMercurialeSubcategories,
  fetchMercurialeSuppliers,
  fetchMercuriales,
  updateMercuriale,
  updateMercurialeArticle,
  updateMercurialeMasterArticle,
  updateMercurialeSupplier,
} from "./api"
import type {
  ApiMercuriale,
  ApiMercurialeArticle,
  ApiMercurialeCategory,
  ApiMercurialeMasterArticle,
  ApiMercurialeRequest,
  ApiMercurialeSubcategory,
  ApiMercurialeSupplier,
} from "./api"
import type {
  Mercuriale,
  MercurialeArticle,
  MercurialeCategory,
  MercurialeMasterArticle,
  MercurialeRequest,
  MercurialeSubcategory,
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

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toDateOnly = (value?: string | null) =>
  value ? value.split("T")[0] : null

const toDateKey = (value?: string | null) => {
  if (!value) return 0
  const dateValue = value.split("T")[0]
  const date = new Date(dateValue)
  return Number.isFinite(date.getTime()) ? date.getTime() : 0
}

const normalizeSupplierLabel = (value?: SupplierLabel | null): SupplierLabel =>
  value ?? "OTHER"

const dedupe = (values: string[]) =>
  Array.from(new Set(values.filter((value) => value.trim().length > 0)))

const computeArticleVariations = (
  mercuriales: Mercuriale[],
  articles: MercurialeArticle[]
) => {
  const mercurialesBySupplier = new Map<string, Mercuriale[]>()
  for (const mercuriale of mercuriales) {
    if (!mercuriale.supplierId) continue
    const list = mercurialesBySupplier.get(mercuriale.supplierId) ?? []
    list.push(mercuriale)
    mercurialesBySupplier.set(mercuriale.supplierId, list)
  }

  const previousByMercuriale = new Map<string, string | null>()
  mercurialesBySupplier.forEach((list) => {
    const ordered = [...list].sort(
      (a, b) =>
        toDateKey(a.effectiveFrom ?? a.updatedAt) -
        toDateKey(b.effectiveFrom ?? b.updatedAt)
    )
    ordered.forEach((item, index) => {
      previousByMercuriale.set(item.id, index > 0 ? ordered[index - 1].id : null)
    })
  })

  const priceByMercuriale = new Map<string, Map<string, number>>()
  for (const article of articles) {
    if (!article.mercurialeId || article.priceStandard == null) continue
    const map = priceByMercuriale.get(article.mercurialeId) ?? new Map()
    map.set(article.masterArticleId, article.priceStandard)
    priceByMercuriale.set(article.mercurialeId, map)
  }

  return articles.map((article) => {
    const previousMercurialeId = previousByMercuriale.get(article.mercurialeId)
    const currentPrice = article.priceStandard
    if (!previousMercurialeId || currentPrice == null || currentPrice === 0) {
      return { ...article, variation: null }
    }
    const previousPrice =
      priceByMercuriale
        .get(previousMercurialeId)
        ?.get(article.masterArticleId) ?? null
    if (previousPrice == null || previousPrice === 0) {
      return { ...article, variation: null }
    }
    return {
      ...article,
      variation: (currentPrice - previousPrice) / previousPrice,
    }
  })
}

const mapSupplier = (row: ApiMercurialeSupplier): MercurialeSupplier => ({
  id: row.id,
  name: row.name ?? "Fournisseur",
  label: normalizeSupplierLabel(row.label),
  active: Boolean(row.active),
  marketSupplierId: row.market_supplier_id ?? null,
  mercurialLogoPath: row.mercurial_logo_path ?? null,
})

const mapMercuriale = (row: ApiMercuriale): Mercuriale => ({
  id: row.id,
  supplierId: row.mercuriale_supplier_id ?? "",
  name: row.name ?? "Mercuriale",
  description: row.description ?? null,
  active: Boolean(row.active),
  effectiveFrom: toDateOnly(row.effective_from),
  effectiveTo: toDateOnly(row.effective_to),
  updatedAt: toDateOnly(row.updated_at ?? row.created_at),
})

const mapMasterArticle = (
  row: ApiMercurialeMasterArticle,
  categoryById: Map<string, string>,
  subcategoryById: Map<string, string>
): MercurialeMasterArticle => ({
  id: row.id,
  supplierId: row.mercurial_supplier_id ?? "",
  name: row.name ?? "Master article",
  unit: row.unit ?? "u",
  vatRate: toNumber(row.vat_rate) ?? 0,
  category: categoryById.get(row.category_id ?? "") ?? "Divers",
  subcategory: subcategoryById.get(row.subcategory_id ?? "") ?? "Divers",
  raceName: row.race_name ?? null,
  description: row.description ?? null,
  active: Boolean(row.active),
})

const mapArticle = (
  row: ApiMercurialeArticle,
  variation: number | null = null
): MercurialeArticle => ({
  id: row.id,
  mercurialeId: row.mercuriale_id ?? "",
  masterArticleId: row.mercurial_master_article_id ?? "",
  priceStandard: toNumber(row.price_standard),
  pricePlus: toNumber(row.price_plus),
  pricePremium: toNumber(row.price_premium),
  variation,
  active: Boolean(row.active),
})

const mapCategory = (row: ApiMercurialeCategory): MercurialeCategory => ({
  id: row.id,
  name: row.name ?? "Divers",
  createdAt: row.created_at ?? null,
})

const mapSubcategory = (
  row: ApiMercurialeSubcategory
): MercurialeSubcategory => ({
  id: row.id,
  name: row.name ?? "Divers",
  categoryId: row.category_id ?? null,
  createdAt: row.created_at ?? null,
})

const mapRequest = (
  row: ApiMercurialeRequest,
  establishmentById: Map<string, string>
): MercurialeRequest => ({
  id: row.id,
  createdAt: toDateOnly(row.created_at) ?? "--",
  establishment:
    establishmentById.get(row.establishment_id ?? "") ??
    row.establishment_id ??
    "--",
  message: row.message ?? "--",
})

export default function AdminMercurialesPage() {
  const [requests, setRequests] = useState<MercurialeRequest[]>([])
  const [suppliers, setSuppliers] = useState<MercurialeSupplier[]>([])
  const [mercuriales, setMercuriales] = useState<Mercuriale[]>([])
  const [masterArticles, setMasterArticles] = useState<MercurialeMasterArticle[]>([])
  const [articles, setArticles] = useState<MercurialeArticle[]>([])
  const [categories, setCategories] = useState<MercurialeCategory[]>([])
  const [subcategories, setSubcategories] = useState<MercurialeSubcategory[]>([])
  const [view, setView] = useState<ViewState>({ type: "list" })

  useEffect(() => {
    let active = true

    const loadData = async () => {
      try {
        const [
          requestsData,
          suppliersData,
          mercurialesData,
          masterArticlesData,
          articlesData,
          categoriesData,
          subcategoriesData,
          establishmentsData,
        ] = await Promise.all([
          fetchMercurialeRequests(),
          fetchMercurialeSuppliers(),
          fetchMercuriales(),
          fetchMercurialeMasterArticles(),
          fetchMercurialeArticles(),
          fetchMercurialeCategories(),
          fetchMercurialeSubcategories(),
          fetchEstablishments(),
        ])

        if (!active) return

        const establishmentById = new Map(
          establishmentsData.map((row) => [row.id, row.name ?? row.id])
        )

        const mappedCategories = categoriesData.map(mapCategory)
        const mappedSubcategories = subcategoriesData.map(mapSubcategory)
        const categoryById = new Map(
          mappedCategories.map((row) => [row.id, row.name])
        )
        const subcategoryById = new Map(
          mappedSubcategories.map((row) => [row.id, row.name])
        )

        const mappedSuppliers = suppliersData.map(mapSupplier)
        const mappedMercuriales = mercurialesData.map(mapMercuriale)
        const mappedMasterArticles = masterArticlesData.map((row) =>
          mapMasterArticle(row, categoryById, subcategoryById)
        )
        const mappedArticles = articlesData.map((row) => mapArticle(row))

        setRequests(
          requestsData.map((row) => mapRequest(row, establishmentById))
        )
        setSuppliers(mappedSuppliers)
        setMercuriales(mappedMercuriales)
        setMasterArticles(mappedMasterArticles)
        setCategories(mappedCategories)
        setSubcategories(mappedSubcategories)
        setArticles(computeArticleVariations(mappedMercuriales, mappedArticles))
      } catch (error) {
        console.error(error)
        toast.error("Impossible de charger les mercuriales.")
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [])

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

  const categoryOptions = useMemo(
    () => dedupe(categories.map((row) => row.name)),
    [categories]
  )

  const subcategoryOptions = useMemo(
    () => dedupe(subcategories.map((row) => row.name)),
    [subcategories]
  )

  const categoryByName = useMemo(
    () => new Map(categories.map((row) => [row.name, row.id])),
    [categories]
  )

  const subcategoryByName = useMemo(
    () => new Map(subcategories.map((row) => [row.name, row.id])),
    [subcategories]
  )

  const refreshArticleVariations = (
    nextArticles: MercurialeArticle[],
    nextMercuriales = mercuriales
  ) => computeArticleVariations(nextMercuriales, nextArticles)

  const handleCreateSupplier = async (input: SupplierCreateInput) => {
    try {
      const created = await createMercurialeSupplier({
        name: input.name,
        label: input.label,
        active: input.active,
        market_supplier_id: input.marketSupplierId ?? null,
        mercurial_logo_path: input.mercurialLogoPath ?? null,
      })
      setSuppliers((prev) => [...prev, mapSupplier(created)])
      toast.success("Fournisseur cree.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de creer le fournisseur.")
    }
  }

  const handleUpdateSupplier = async (input: SupplierUpdateInput) => {
    if (!selectedSupplier) return
    try {
      const updated = await updateMercurialeSupplier(selectedSupplier.id, {
        name: input.name,
        label: input.label,
        active: input.active,
        market_supplier_id: input.marketSupplierId ?? null,
        mercurial_logo_path: input.mercurialLogoPath ?? null,
      })
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === selectedSupplier.id
            ? mapSupplier(updated)
            : supplier
        )
      )
      toast.success("Fournisseur mis a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de mettre a jour le fournisseur.")
    }
  }

  const handleCreateMercuriale = async (input: MercurialeCreateInput) => {
    if (!selectedSupplier) return
    try {
      const created = await createMercuriale({
        mercuriale_supplier_id: selectedSupplier.id,
        name: input.name,
        description: input.description ?? null,
        active: input.active,
        effective_from: input.effectiveFrom ?? null,
        effective_to: input.effectiveTo ?? null,
      })
      const mapped = mapMercuriale(created)
      setMercuriales((prev) => {
        const next = [...prev, mapped]
        setArticles((prevArticles) => refreshArticleVariations(prevArticles, next))
        return next
      })
      toast.success("Mercuriale creee.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de creer la mercuriale.")
    }
  }

  const handleUpdateMercuriale = async (input: MercurialeUpdateInput) => {
    if (!selectedMercuriale) return
    try {
      const updated = await updateMercuriale(selectedMercuriale.id, {
        name: input.name,
        description: input.description ?? null,
        active: input.active,
        effective_from: input.effectiveFrom ?? null,
        effective_to: input.effectiveTo ?? null,
      })
      const mapped = mapMercuriale(updated)
      setMercuriales((prev) => {
        const next = prev.map((item) =>
          item.id === selectedMercuriale.id ? mapped : item
        )
        setArticles((prevArticles) => refreshArticleVariations(prevArticles, next))
        return next
      })
      toast.success("Mercuriale mise a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de mettre a jour la mercuriale.")
    }
  }

  const handleCreateMasterArticle = async (input: MasterArticleCreateInput) => {
    if (!selectedSupplier) return
    try {
      const created = await createMercurialeMasterArticle({
        mercurial_supplier_id: selectedSupplier.id,
        name: input.name,
        unit: input.unit,
        vat_rate: input.vatRate,
        category_id: categoryByName.get(input.category) ?? null,
        subcategory_id: subcategoryByName.get(input.subcategory) ?? null,
        race_name: input.raceName ?? null,
        description: input.description ?? null,
        active: input.active,
      })
      const categoryById = new Map(categories.map((row) => [row.id, row.name]))
      const subcategoryById = new Map(
        subcategories.map((row) => [row.id, row.name])
      )
      setMasterArticles((prev) => [
        ...prev,
        mapMasterArticle(created, categoryById, subcategoryById),
      ])
      toast.success("Master article cree.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de creer le master article.")
    }
  }

  const handleUpdateMasterArticle = async (
    id: string,
    input: MasterArticleUpdateInput
  ) => {
    try {
      const updated = await updateMercurialeMasterArticle(id, {
        name: input.name,
        unit: input.unit,
        vat_rate: input.vatRate,
        category_id: categoryByName.get(input.category) ?? null,
        subcategory_id: subcategoryByName.get(input.subcategory) ?? null,
        race_name: input.raceName ?? null,
        description: input.description ?? null,
        active: input.active,
      })
      const categoryById = new Map(categories.map((row) => [row.id, row.name]))
      const subcategoryById = new Map(
        subcategories.map((row) => [row.id, row.name])
      )
      setMasterArticles((prev) =>
        prev.map((row) =>
          row.id === id
            ? mapMasterArticle(updated, categoryById, subcategoryById)
            : row
        )
      )
      toast.success("Master article mis a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de mettre a jour le master article.")
    }
  }

  const handleDeleteMasterArticle = async (id: string) => {
    try {
      await deleteMercurialeMasterArticle(id)
      setMasterArticles((prev) => prev.filter((row) => row.id !== id))
      setArticles((prev) =>
        refreshArticleVariations(
          prev.filter((row) => row.masterArticleId !== id)
        )
      )
      toast.success("Master article supprime.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de supprimer le master article.")
    }
  }

  const handleCreateArticle = async (input: MercurialeArticleCreateInput) => {
    if (!selectedMercuriale) return
    try {
      const created = await createMercurialeArticle({
        mercuriale_id: selectedMercuriale.id,
        mercurial_master_article_id: input.masterArticleId,
        price_standard: input.priceStandard ?? null,
        price_plus: input.pricePlus ?? null,
        price_premium: input.pricePremium ?? null,
        active: input.active,
      })
      const mapped = mapArticle(created, input.variation ?? null)
      setArticles((prev) => refreshArticleVariations([...prev, mapped]))
      toast.success("Article ajoute.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible d ajouter l article.")
    }
  }

  const handleUpdateArticle = async (
    id: string,
    input: MercurialeArticleUpdateInput
  ) => {
    try {
      const updated = await updateMercurialeArticle(id, {
        mercurial_master_article_id: input.masterArticleId,
        price_standard: input.priceStandard ?? null,
        price_plus: input.pricePlus ?? null,
        price_premium: input.pricePremium ?? null,
        active: input.active,
      })
      setArticles((prev) =>
        refreshArticleVariations(
          prev.map((row) =>
            row.id === id
              ? {
                  ...mapArticle(updated, input.variation ?? null),
                  variation: input.variation ?? row.variation ?? null,
                }
              : row
          )
        )
      )
      toast.success("Article mis a jour.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de mettre a jour l article.")
    }
  }

  const handleRemoveArticle = async (articleId: string) => {
    try {
      await deleteMercurialeArticle(articleId)
      setArticles((prev) =>
        refreshArticleVariations(prev.filter((item) => item.id !== articleId))
      )
      toast.success("Article supprime.")
    } catch (error) {
      console.error(error)
      toast.error("Impossible de supprimer l article.")
    }
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
      categoryOptions={categoryOptions}
      subcategoryOptions={subcategoryOptions}
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
