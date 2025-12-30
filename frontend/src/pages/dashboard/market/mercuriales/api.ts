import { useEffect, useMemo, useState } from "react"
import api from "@/lib/axiosClient"
import type {
  Mercuriale,
  MercurialeArticle,
  MercurialeMasterArticle,
  MercurialeSupplier,
} from "./types"

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const fetchMercurialeSuppliers = async () => {
  const res = await api.get<MercurialeSupplier[]>("/mercuriale_supplier", {
    params: { order_by: "name", direction: "asc", limit: 200 },
  })
  return res.data ?? []
}

export const fetchMercuriales = async () => {
  const res = await api.get<Mercuriale[]>("/mercuriales", {
    params: { order_by: "effective_from", direction: "desc", limit: 200 },
  })
  return res.data ?? []
}

export const fetchMercurialeMasterArticles = async () => {
  const res = await api.get<MercurialeMasterArticle[]>("/mercuriale_master_article", {
    params: { order_by: "name", direction: "asc", limit: 200 },
  })
  return (res.data ?? []).map((row) => ({
    ...row,
    vat_rate: toNumber(row.vat_rate),
  }))
}

export const fetchMercurialeArticles = async () => {
  const res = await api.get<MercurialeArticle[]>("/mercuriale_articles", {
    params: { order_by: "created_at", direction: "desc", limit: 200 },
  })
  return (res.data ?? []).map((row) => ({
    ...row,
    price_standard: toNumber(row.price_standard),
    price_plus: toNumber(row.price_plus),
    price_premium: toNumber(row.price_premium),
  }))
}

export type MercurialeSuppliersData = {
  suppliers: MercurialeSupplier[]
  isLoading: boolean
  error: string | null
}

export const useMercurialeSuppliers = (): MercurialeSuppliersData => {
  const [suppliers, setSuppliers] = useState<MercurialeSupplier[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError(null)

    fetchMercurialeSuppliers()
      .then((data) => {
        if (!active) return
        setSuppliers(data)
      })
      .catch(() => {
        if (!active) return
        setError("Impossible de charger les fournisseurs de mercuriale.")
        setSuppliers([])
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const ordered = useMemo(
    () => suppliers.slice().sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "fr")),
    [suppliers]
  )

  return { suppliers: ordered, isLoading, error }
}

export type MercurialeSupplierData = {
  supplier: MercurialeSupplier | null
  mercuriales: Mercuriale[]
  masterArticles: MercurialeMasterArticle[]
  articles: MercurialeArticle[]
  isLoading: boolean
  error: string | null
}

export const useMercurialeSupplierData = (
  supplierId?: string | null
): MercurialeSupplierData => {
  const [supplier, setSupplier] = useState<MercurialeSupplier | null>(null)
  const [mercuriales, setMercuriales] = useState<Mercuriale[]>([])
  const [masterArticles, setMasterArticles] = useState<MercurialeMasterArticle[]>([])
  const [articles, setArticles] = useState<MercurialeArticle[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supplierId) {
      setSupplier(null)
      setMercuriales([])
      setMasterArticles([])
      setArticles([])
      return
    }

    let active = true
    setIsLoading(true)
    setError(null)

    Promise.all([
      fetchMercurialeSuppliers(),
      fetchMercuriales(),
      fetchMercurialeMasterArticles(),
      fetchMercurialeArticles(),
    ])
      .then(([suppliersData, mercurialesData, masterData, articlesData]) => {
        if (!active) return
        const currentSupplier = suppliersData.find((item) => item.id === supplierId) ?? null
        const supplierMercuriales = mercurialesData.filter(
          (item) => item.mercuriale_supplier_id === supplierId
        )
        const supplierMasterArticles = masterData
          .filter((item) => item.mercurial_supplier_id === supplierId)
          .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "fr"))
        const mercurialeIds = new Set(supplierMercuriales.map((item) => item.id))
        const supplierArticles = articlesData.filter((item) => mercurialeIds.has(item.mercuriale_id))

        setSupplier(currentSupplier)
        setMercuriales(supplierMercuriales)
        setMasterArticles(supplierMasterArticles)
        setArticles(supplierArticles)
      })
      .catch(() => {
        if (!active) return
        setError("Impossible de charger les données de mercuriale.")
        setSupplier(null)
        setMercuriales([])
        setMasterArticles([])
        setArticles([])
      })
      .finally(() => {
        if (!active) return
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [supplierId])

  return { supplier, mercuriales, masterArticles, articles, isLoading, error }
}
