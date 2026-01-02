import api from "@/lib/axiosClient"
import type { SupplierLabel } from "./types"

export type ApiMercurialeRequest = {
  id: string
  created_at?: string | null
  establishment_id?: string | null
  message?: string | null
  internal_notes?: string | null
}

export type ApiMercurialeSupplier = {
  id: string
  created_at?: string | null
  name?: string | null
  label?: SupplierLabel | null
  active?: boolean | null
  mercurial_logo_path?: string | null
  market_supplier_id?: string | null
}

export type ApiMercuriale = {
  id: string
  name?: string | null
  description?: string | null
  active?: boolean | null
  effective_from?: string | null
  effective_to?: string | null
  created_at?: string | null
  updated_at?: string | null
  mercuriale_supplier_id?: string | null
  market_supplier_id?: string | null
}

export type ApiMercurialeMasterArticle = {
  id: string
  created_at?: string | null
  mercurial_supplier_id?: string | null
  name?: string | null
  unit?: string | null
  vat_rate?: number | string | null
  active?: boolean | null
  description?: string | null
  notes?: string | null
  market_master_article?: string | null
  category_id?: string | null
  subcategory_id?: string | null
  race_name?: string | null
}

export type ApiMercurialeArticle = {
  id: string
  mercuriale_id?: string | null
  mercurial_master_article_id?: string | null
  price_standard?: number | string | null
  price_plus?: number | string | null
  price_premium?: number | string | null
  active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type ApiMercurialeCategory = {
  id: string
  created_at?: string | null
  name?: string | null
}

export type ApiMercurialeSubcategory = {
  id: string
  created_at?: string | null
  name?: string | null
  category_id?: string | null
}

export type ApiEstablishment = {
  id: string
  name?: string | null
}

export const fetchMercurialeRequests = async () => {
  const res = await api.get<ApiMercurialeRequest[]>(
    "/mercurial_request?order_by=created_at&direction=desc&limit=500"
  )
  return res.data ?? []
}

export const fetchMercurialeSuppliers = async () => {
  const res = await api.get<ApiMercurialeSupplier[]>(
    "/mercuriale_supplier?order_by=name&direction=asc&limit=2000"
  )
  return res.data ?? []
}

export const createMercurialeSupplier = async (
  payload: Partial<ApiMercurialeSupplier>
) => {
  const res = await api.post<ApiMercurialeSupplier>("/mercuriale_supplier", payload)
  return res.data
}

export const updateMercurialeSupplier = async (
  id: string,
  payload: Partial<ApiMercurialeSupplier>
) => {
  const res = await api.patch<ApiMercurialeSupplier>(
    `/mercuriale_supplier/${id}`,
    payload
  )
  return res.data
}

export const fetchMercuriales = async () => {
  const res = await api.get<ApiMercuriale[]>(
    "/mercuriales?order_by=effective_from&direction=desc&limit=2000"
  )
  return res.data ?? []
}

export const createMercuriale = async (payload: Partial<ApiMercuriale>) => {
  const res = await api.post<ApiMercuriale>("/mercuriales", payload)
  return res.data
}

export const updateMercuriale = async (
  id: string,
  payload: Partial<ApiMercuriale>
) => {
  const res = await api.patch<ApiMercuriale>(`/mercuriales/${id}`, payload)
  return res.data
}

export const fetchMercurialeMasterArticles = async () => {
  const res = await api.get<ApiMercurialeMasterArticle[]>(
    "/mercuriale_master_article?order_by=name&direction=asc&limit=5000"
  )
  return res.data ?? []
}

export const createMercurialeMasterArticle = async (
  payload: Partial<ApiMercurialeMasterArticle>
) => {
  const res = await api.post<ApiMercurialeMasterArticle>(
    "/mercuriale_master_article",
    payload
  )
  return res.data
}

export const updateMercurialeMasterArticle = async (
  id: string,
  payload: Partial<ApiMercurialeMasterArticle>
) => {
  const res = await api.patch<ApiMercurialeMasterArticle>(
    `/mercuriale_master_article/${id}`,
    payload
  )
  return res.data
}

export const deleteMercurialeMasterArticle = async (id: string) => {
  const res = await api.delete<{ deleted: boolean }>(
    `/mercuriale_master_article/${id}`
  )
  return res.data
}

export const fetchMercurialeArticles = async () => {
  const res = await api.get<ApiMercurialeArticle[]>(
    "/mercuriale_articles?order_by=created_at&direction=desc&limit=5000"
  )
  return res.data ?? []
}

export const createMercurialeArticle = async (
  payload: Partial<ApiMercurialeArticle>
) => {
  const res = await api.post<ApiMercurialeArticle>("/mercuriale_articles", payload)
  return res.data
}

export const updateMercurialeArticle = async (
  id: string,
  payload: Partial<ApiMercurialeArticle>
) => {
  const res = await api.patch<ApiMercurialeArticle>(
    `/mercuriale_articles/${id}`,
    payload
  )
  return res.data
}

export const deleteMercurialeArticle = async (id: string) => {
  const res = await api.delete<{ deleted: boolean }>(
    `/mercuriale_articles/${id}`
  )
  return res.data
}

export const fetchMercurialeCategories = async () => {
  const res = await api.get<ApiMercurialeCategory[]>(
    "/mercuriale_categories?order_by=name&direction=asc&limit=2000"
  )
  return res.data ?? []
}

export const fetchMercurialeSubcategories = async () => {
  const res = await api.get<ApiMercurialeSubcategory[]>(
    "/mercuriale_subcategories?order_by=name&direction=asc&limit=5000"
  )
  return res.data ?? []
}

export const fetchEstablishments = async () => {
  const res = await api.get<ApiEstablishment[]>(
    "/establishments?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data ?? []
}
