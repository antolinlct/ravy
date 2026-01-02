import api from "@/lib/axiosClient"

export type ApiLog = {
  id: string
  created_at?: string | null
  user_id?: string | null
  establishment_id?: string | null
  type?: "context" | "job" | null
  action?:
    | "login"
    | "logout"
    | "create"
    | "update"
    | "delete"
    | "view"
    | "import"
    | null
  text?: string | null
  json?: Record<string, unknown> | string | null
  element_id?: string | null
  element_type?:
    | "invoice"
    | "recipe"
    | "supplier"
    | "financial_reports"
    | "user"
    | "establishment"
    | "variation"
    | null
}

export type ApiMaintenance = {
  id: string
  is_active?: boolean | null
  start_date?: string | null
  coutdown_hour?: number | string | null
  message?: string | null
}

export type ApiEstablishment = {
  id: string
  name?: string | null
}

const toIso = (value?: string) => {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export const fetchLogs = async (params: { start?: string; end?: string; limit?: number }) => {
  const query = new URLSearchParams()
  query.set("order_by", "created_at")
  query.set("direction", "desc")
  query.set("limit", String(params.limit ?? 500))
  const startIso = toIso(params.start)
  const endIso = toIso(params.end)
  if (startIso) query.set("created_at_gte", startIso)
  if (endIso) query.set("created_at_lte", endIso)

  const res = await api.get<ApiLog[]>(`/logs?${query.toString()}`)
  return res.data
}

export const fetchLatestMaintenance = async () => {
  const res = await api.get<ApiMaintenance[]>(
    "/maintenance?order_by=start_date&direction=desc&limit=1"
  )
  return res.data?.[0] ?? null
}

export const createMaintenance = async (payload: {
  is_active: boolean
  start_date: string | null
  coutdown_hour: number | null
  message: string | null
}) => {
  const res = await api.post<ApiMaintenance>("/maintenance", payload)
  return res.data
}

export const updateMaintenance = async (
  id: string,
  payload: Partial<{
    is_active: boolean
    start_date: string | null
    coutdown_hour: number | null
    message: string | null
  }>
) => {
  const res = await api.patch<ApiMaintenance>(`/maintenance/${id}`, payload)
  return res.data
}

export const fetchEstablishments = async () => {
  const res = await api.get<ApiEstablishment[]>(
    "/establishments?order_by=created_at&direction=desc&limit=2000"
  )
  return res.data
}
