import api from "@/lib/axiosClient"
import type { SupplierLabel } from "./types"

export type ApiMergeRequest = {
  id: string
  created_at?: string | null
  status?: "pending" | "to_confirm" | "accepted" | "resolved" | "refused" | null
  source_market_supplier_ids?: unknown
  target_market_supplier_id?: string | null
  requesting_establishment_id?: string | null
}

export type ApiMarketSupplier = {
  id: string
  name?: string | null
  active?: boolean | null
  label?: SupplierLabel | null
  updated_at?: string | null
  created_at?: string | null
}

export type ApiMarketSupplierAlias = {
  id: string
  supplier_market_id?: string | null
  alias?: string | null
  created_at?: string | null
}

export type ApiEstablishment = {
  id: string
  name?: string | null
}

export const fetchMergeRequests = async () => {
  const res = await api.get<ApiMergeRequest[]>(
    "/supplier_merge_request?order_by=created_at&direction=desc&limit=500"
  )
  return res.data
}

export const createMergeRequest = async (payload: {
  source_market_supplier_ids: Record<string, unknown>
  target_market_supplier_id: string
  requesting_establishment_id?: string | null
  status?: ApiMergeRequest["status"]
}) => {
  const res = await api.post<ApiMergeRequest>("/supplier_merge_request", payload)
  return res.data
}

export const updateMergeRequest = async (
  id: string,
  payload: Partial<ApiMergeRequest>
) => {
  const res = await api.patch<ApiMergeRequest>(`/supplier_merge_request/${id}`, payload)
  return res.data
}

export const mergeSuppliers = async (mergeRequestId: string) => {
  const res = await api.post("/logic/write/merge-suppliers", {
    merge_request_id: mergeRequestId,
  })
  return res.data
}

export const fetchMarketSuppliers = async () => {
  const res = await api.get<ApiMarketSupplier[]>(
    "/market_suppliers?order_by=name&direction=asc&limit=2000"
  )
  return res.data
}

export const updateMarketSupplier = async (
  id: string,
  payload: Partial<Pick<ApiMarketSupplier, "active" | "label" | "name">>
) => {
  const res = await api.patch<ApiMarketSupplier>(`/market_suppliers/${id}`, payload)
  return res.data
}

export const fetchMarketSupplierAliases = async () => {
  const res = await api.get<ApiMarketSupplierAlias[]>(
    "/market_supplier_alias?order_by=created_at&direction=desc&limit=5000"
  )
  return res.data
}

export const createMarketSupplierAlias = async (payload: {
  supplier_market_id: string
  alias: string
}) => {
  const res = await api.post<ApiMarketSupplierAlias>("/market_supplier_alias", payload)
  return res.data
}

export const updateMarketSupplierAlias = async (
  id: string,
  payload: Partial<ApiMarketSupplierAlias>
) => {
  const res = await api.patch<ApiMarketSupplierAlias>(
    `/market_supplier_alias/${id}`,
    payload
  )
  return res.data
}

export const deleteMarketSupplierAlias = async (id: string) => {
  const res = await api.delete<{ deleted: boolean }>(`/market_supplier_alias/${id}`)
  return res.data
}

export const fetchEstablishments = async () => {
  const res = await api.get<ApiEstablishment[]>(
    "/establishments?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}
