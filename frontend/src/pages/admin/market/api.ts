import api from "@/lib/axiosClient"
import type { MarketSupplierLabel } from "./types"

export type ApiMarketSupplier = {
  id: string
  name?: string | null
  label?: MarketSupplierLabel | null
  active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type ApiMarketMasterArticle = {
  id: string
  market_supplier_id?: string | null
  name?: string | null
  unit?: string | null
  unformatted_name?: string | null
  current_unit_price?: number | string | null
  is_active?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export type ApiMarketArticle = {
  id: string
  market_master_article_id?: string | null
  market_supplier_id?: string | null
  date?: string | null
  unit_price?: number | string | null
  gross_unit_price?: number | string | null
  unit?: string | null
  discounts?: number | string | null
  duties_and_taxes?: number | string | null
  quantity?: number | string | null
  total?: number | string | null
  establishment_id?: string | null
  created_by?: string | null
  invoice_path?: string | null
  invoice_id?: string | null
  is_active?: boolean | null
}

export type ApiUserProfile = {
  id: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
}

export type ApiEstablishment = {
  id: string
  name?: string | null
  full_adresse?: string | null
}

export const fetchMarketSuppliers = async () => {
  const res = await api.get<ApiMarketSupplier[]>(
    "/market_suppliers?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const fetchMarketMasterArticles = async () => {
  const res = await api.get<ApiMarketMasterArticle[]>(
    "/market_master_articles?order_by=name&direction=asc&limit=5000"
  )
  return res.data
}

export const fetchMarketArticlesByMaster = async (masterId: string) => {
  const res = await api.get<ApiMarketArticle[]>(
    `/market_articles?market_master_article_id=${masterId}&order_by=date&direction=desc&limit=5000`
  )
  return res.data
}

export const fetchUserProfiles = async () => {
  const res = await api.get<ApiUserProfile[]>(
    "/user_profiles?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const fetchEstablishments = async () => {
  const res = await api.get<ApiEstablishment[]>(
    "/establishments?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}

export const updateMarketSupplier = async (
  id: string,
  payload: Partial<Pick<ApiMarketSupplier, "active" | "label">>
) => {
  const res = await api.patch<ApiMarketSupplier>(`/market_suppliers/${id}`, payload)
  return res.data
}

export const updateMarketMasterArticle = async (
  id: string,
  payload: Partial<Pick<ApiMarketMasterArticle, "is_active">>
) => {
  const res = await api.patch<ApiMarketMasterArticle>(
    `/market_master_articles/${id}`,
    payload
  )
  return res.data
}
